import {
  AdminOrderSummary,
  RtoVerificationResult,
  CodRemittanceEntry,
  CodRemittanceReport,
  LogisticsPnL,
} from '../../types/sellerCentral';
import { MerchantInventoryService, defaultMerchantInventoryService } from './merchantInventoryService';
import { OrderPipelineService, defaultOrderPipelineService } from './orderPipelineService';
import { defaultQueueService } from './notificationQueueService';

/**
 * Module 19 - Task 6: RTO Returns Verification & COD Remittance Reconciliation Service
 * 
 * Complies with:
 * - Item 28: Dedicated RTO Verification Desk (Scan AWB/Barcode, inspect condition, auto-restock, 1-click refund)
 * - Item 29: Daily COD Remittance Reconciliation (Delhivery/Shiprocket payout vs bank statement credits)
 * - Item 38: Logistics P&L Tracker (Freight billed vs delivery fees collected vs packaging costs)
 */

export class ReturnsReconciliationService {
  private inventoryService: MerchantInventoryService;
  private pipelineService: OrderPipelineService;
  private rtoRecords: Map<string, RtoVerificationResult> = new Map();

  constructor(
    inventoryService = defaultMerchantInventoryService,
    pipelineService = defaultOrderPipelineService
  ) {
    this.inventoryService = inventoryService;
    this.pipelineService = pipelineService;
  }

  /**
   * Item 28: Process incoming RTO parcel at verification desk
   */
  public processRtoReturn(
    identifier: string, // order_id, order_number, or awb_code
    input: {
      condition: 'intact_resellable' | 'damaged';
      damage_notes?: string;
      restock_to_shelf?: boolean;
      refund_mode?: 'instant_upi_refund' | 'store_credit' | 'none';
      refund_amount?: number;
    }
  ): { success: boolean; result?: RtoVerificationResult; error?: string } {
    // Search order by id, order_number, or awb
    const cleanId = identifier.trim().toLowerCase();
    let order = this.pipelineService.getOrderById(identifier);
    if (!order) {
      const orders = this.pipelineService.searchOrders(cleanId);
      order = orders.find(
        (o) =>
          o.order_id.toLowerCase() === cleanId ||
          o.order_number.toLowerCase() === cleanId ||
          (o.awb_code && o.awb_code.toLowerCase() === cleanId)
      ) || null;
    }

    if (!order) {
      return {
        success: false,
        error: `পার্সেল ট্র্যাকিং কোড বা অর্ডার আইডি "${identifier}" খুঁজে পাওয়া যায়নি`,
      };
    }

    // Set order pipeline status
    order.pipeline_status = 'rto_returned';
    order.rto_reason = input.damage_notes || 'Customer refused delivery / RTO';
    order.updated_at = new Date().toISOString();

    const restockedItems: Array<{ sku: string; quantity: number }> = [];
    let restocked = false;

    // If undamaged and restock enabled, return items to active shelf inventory
    if (input.condition === 'intact_resellable' && input.restock_to_shelf !== false) {
      for (const item of order.items) {
        this.inventoryService.adjustStock(
          item.sku,
          item.quantity,
          `RTO Restock for Order ${order.order_number}`
        );
        restockedItems.push({ sku: item.sku, quantity: item.quantity });
      }
      order.rto_restocked = true;
      restocked = true;
    } else {
      order.rto_restocked = false;
    }

    // Process refund if requested (for prepaid orders or goodwill credit)
    let refundStatus: RtoVerificationResult['refund_status'] = 'not_applicable';
    let refundReference: string | undefined;
    const refundAmt = input.refund_amount !== undefined ? input.refund_amount : order.total_amount;

    if (order.payment_status === 'PAID' && input.refund_mode !== 'none') {
      if (input.refund_mode === 'instant_upi_refund') {
        refundStatus = 'refunded';
        refundReference = `UPI_REF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      } else if (input.refund_mode === 'store_credit') {
        refundStatus = 'store_credit_issued';
        refundReference = `SCR_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      // Enqueue customer refund notification via SMS / WhatsApp
      defaultQueueService.enqueueNotification({
        order_id: order.order_id,
        recipient_name: order.customer_name,
        phone_number: order.customer_phone,
        trigger: 'order_cancelled_refund',
        template_name: 'mmbook_order_refund_bn_v1',
        variables: {
          customer_name: order.customer_name,
          order_id: order.order_number,
          refund_amount: refundAmt.toString(),
          refund_utr: refundReference || 'N/A',
        },
      });
    }

    const verificationRecord: RtoVerificationResult = {
      order_id: order.order_id,
      order_number: order.order_number,
      awb_code: order.awb_code || 'N/A',
      condition: input.condition,
      restocked,
      restocked_items: restockedItems,
      refund_status: refundStatus,
      refund_reference: refundReference,
      refund_amount_inr: refundAmt,
      damage_notes: input.damage_notes,
      processed_at: new Date().toISOString(),
    };

    this.rtoRecords.set(order.order_id, verificationRecord);

    return { success: true, result: verificationRecord };
  }

  /**
   * Get all verified RTO records
   */
  public getRtoRecords(): RtoVerificationResult[] {
    return Array.from(this.rtoRecords.values());
  }

  /**
   * Item 29: Daily COD Remittance Reconciliation
   * Matches incoming courier COD credit list with MM Book House COD orders
   */
  public reconcileCodRemittances(
    remittanceEntries: CodRemittanceEntry[]
  ): CodRemittanceReport {
    let matchedCount = 0;
    let matchedAmount = 0;
    const discrepancies: CodRemittanceReport['discrepancies'] = [];

    // Map of active orders for quick AWB matching
    const allOrders = this.pipelineService.searchOrders('');
    const awbOrderMap = new Map<string, AdminOrderSummary>();
    allOrders.forEach((o) => {
      if (o.awb_code) {
        awbOrderMap.set(o.awb_code.trim().toUpperCase(), o);
      }
    });

    for (const entry of remittanceEntries) {
      const order = awbOrderMap.get(entry.awb_code.trim().toUpperCase());

      if (!order) {
        discrepancies.push({
          awb_code: entry.awb_code,
          expected_amount: 0,
          remitted_amount: entry.remitted_amount,
          difference: entry.remitted_amount,
          reason: 'AWB কোডটি এম.এম বুক হাউজের কোনো সক্রিয় অর্ডারের সাথে মেলেনি',
        });
        continue;
      }

      const expected = order.total_amount;
      const diff = entry.remitted_amount - expected;

      if (Math.abs(diff) < 0.01) {
        // Exact match
        matchedCount++;
        matchedAmount += entry.remitted_amount;
        order.cod_remitted = true;
        order.cod_remitted_date = entry.remittance_date;
        order.payment_status = 'PAID';
        order.updated_at = new Date().toISOString();
      } else {
        // Discrepancy (e.g. Courier deduction or shortfall)
        discrepancies.push({
          awb_code: entry.awb_code,
          order_number: order.order_number,
          expected_amount: expected,
          remitted_amount: entry.remitted_amount,
          difference: diff,
          reason:
            diff < 0
              ? `কুরিয়ার অতিরিক্ত ₹${Math.abs(diff)} চার্জ বা কমিশন কর্তন করেছে`
              : `কুরিয়ার অতিরিক্ত ₹${diff} বেশি জমা দিয়েছে`,
        });
      }
    }

    // Calculate pending COD orders (Delivered but not remitted)
    let pendingRemittancesCount = 0;
    let pendingAmount = 0;

    for (const order of allOrders) {
      if (
        order.payment_mode === 'COD' &&
        order.pipeline_status === 'delivered' &&
        !order.cod_remitted
      ) {
        pendingRemittancesCount++;
        pendingAmount += order.total_amount;
      }
    }

    const totalRemitted = remittanceEntries.reduce((sum, e) => sum + e.remitted_amount, 0);

    return {
      total_entries: remittanceEntries.length,
      total_remitted_inr: totalRemitted,
      matched_count: matchedCount,
      matched_amount_inr: matchedAmount,
      discrepancy_count: discrepancies.length,
      discrepancies,
      pending_remittances_count: pendingRemittancesCount,
      pending_amount_inr: pendingAmount,
    };
  }

  /**
   * Item 38: Logistics Profit & Loss (P&L) Calculator
   * Reconciles total courier freight billed vs delivery fees charged to customers vs packaging costs
   */
  public calculateLogisticsPnL(orders: AdminOrderSummary[]): LogisticsPnL {
    let totalFreight = 0;
    let totalDeliveryFees = 0;
    let totalPackaging = 0;
    let parcelCount = 0;

    for (const order of orders) {
      if (!order.is_counter_pickup && order.pipeline_status !== 'cancelled') {
        parcelCount++;
        totalFreight += order.courier_freight_cost || 60; // Default ₹60 standard zone freight
        totalPackaging += order.packaging_cost || 15; // Default ₹15 bubble wrap & box
        totalDeliveryFees += order.customer_delivery_fee || 0; // Customer paid delivery fee
      }
    }

    const netDifference = totalDeliveryFees - (totalFreight + totalPackaging);
    const avgSubsidy = parcelCount > 0 ? Math.abs(netDifference) / parcelCount : 0;

    return {
      total_freight_billed_inr: totalFreight,
      total_delivery_fees_collected_inr: totalDeliveryFees,
      packaging_costs_inr: totalPackaging,
      net_difference_inr: netDifference,
      reconciled_parcels_count: parcelCount,
      average_subsidy_per_parcel_inr: Math.round(avgSubsidy * 100) / 100,
    };
  }
}

export const defaultReturnsReconciliationService = new ReturnsReconciliationService();
