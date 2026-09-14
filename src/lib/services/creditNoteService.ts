import { CreditNote, TaxInvoice } from '../../types/invoice';
import { getStoredInvoice } from './invoiceStorageService';
import { convertAmountToIndianWords } from './invoiceCalculationService';
import { generateSvgQrCode } from './qrCodeGenerator';

/**
 * Module 14: GST Credit Note & Statutory Revised Invoice Generator
 * (Items 41, 45)
 */

const creditNoteCounters = new Map<string, number>();
const creditNoteRegistry = new Map<string, CreditNote>();

/**
 * Sequential Credit Note Number Generator (Item 41)
 * Format: CRN-MMB-YYYY-XXXX
 */
export function generateNextCreditNoteNumber(financialYear: string = '2026-27'): string {
  const count = creditNoteCounters.get(financialYear) || 0;
  const nextSeq = count + 1;
  creditNoteCounters.set(financialYear, nextSeq);

  const baseYear = financialYear.split('-')[0] || '2026';
  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `CRN-MMB-${baseYear}-${paddedSeq}`;
}

export function resetCreditNoteSequence(financialYear: string = '2026-27', startAt: number = 0): void {
  creditNoteCounters.set(financialYear, startAt);
}

export interface IssueCreditNoteInput {
  originalInvoiceNumber: string;
  refundAmount: number;
  reason: 'RETURN_OF_GOODS' | 'POST_SALE_DISCOUNT' | 'DEFICIENCY_IN_SERVICE' | 'ORDER_CANCELLATION';
  customReasonNote?: string;
  financialYear?: string;
}

/**
 * Issues a Statutory GST Credit Note linked to an original invoice (Item 41)
 */
export function issueCreditNote(input: IssueCreditNoteInput): CreditNote {
  const storedRecord = getStoredInvoice(input.originalInvoiceNumber);
  if (!storedRecord) {
    throw new Error(
      `Credit Note issuance failed: Original invoice ${input.originalInvoiceNumber} does not exist.`
    );
  }

  const invoice = storedRecord.invoice;
  const fy = input.financialYear || invoice.financial_year;
  const crnNumber = generateNextCreditNoteNumber(fy);

  const reasonDescription = {
    RETURN_OF_GOODS: 'Customer Return of Printed Books (গ্রাহক কর্তৃক বই ফেরত)',
    POST_SALE_DISCOUNT: 'Post-Sale Additional Promotional Discount (বিক্রয়োত্তর অতিরিক্ত ছাড়)',
    DEFICIENCY_IN_SERVICE: 'Order Discrepancy / Damage Settlement (অর্ডার অসঙ্গতি / ক্ষতিপূরণ)',
    ORDER_CANCELLATION: 'Complete Order Cancellation Prior to Dispatch (অর্ডার বাতিলকরণ)',
  }[input.reason];

  const fullReason = input.customReasonNote 
    ? `${reasonDescription} - Note: ${input.customReasonNote}` 
    : reasonDescription;

  const creditNote: CreditNote = {
    credit_note_number: crnNumber,
    original_invoice_number: invoice.invoice_number,
    order_id: invoice.order_id,
    credit_date: new Date().toISOString().split('T')[0],
    refund_amount: input.refundAmount,
    reason: fullReason,
    seller: invoice.seller,
    customer: invoice.customer,
    created_at: new Date().toISOString(),
  };

  creditNoteRegistry.set(crnNumber, creditNote);
  return creditNote;
}

export function getCreditNote(crnNumber: string): CreditNote | null {
  return creditNoteRegistry.get(crnNumber) || null;
}

/**
 * Generates GST-Compliant Print HTML for Credit Note (Rule 53 of CGST Rules, 2017)
 */
export function generateCreditNoteHtml(creditNote: CreditNote): string {
  const qrSvg = generateSvgQrCode(`https://mmbookhouse.com/api/credit-notes/verify/${creditNote.credit_note_number}`, 100);
  const amountInWords = convertAmountToIndianWords(creditNote.refund_amount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credit Note - ${escapeHtml(creditNote.credit_note_number)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #111827;
      font-size: 12px;
      padding: 20px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none !important; }
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #d1d5db;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #b91c1c;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 900;
      color: #b91c1c;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
      border-radius: 4px;
      background: #f9fafb;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .table th, .table td {
      border: 1px solid #d1d5db;
      padding: 8px;
    }
    .table th {
      background: #f3f4f6;
      text-transform: uppercase;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 12px auto; display: flex; justify-content: flex-end;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #b91c1c; color: white; border: none; font-weight: bold; border-radius: 4px; cursor: pointer;">
      🖨️ Print Credit Note
    </button>
  </div>

  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">CREDIT NOTE</h1>
        <div style="font-size: 11px; color: #4b5563;">(Issued under Section 34 of CGST Act, 2017)</div>
        <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">${escapeHtml(creditNote.seller.trade_name)}</div>
        <div style="font-size: 11px;">GSTIN: <strong>${escapeHtml(creditNote.seller.gstin)}</strong> | PAN: <strong>${escapeHtml(creditNote.seller.pan)}</strong></div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px;">Credit Note No: <strong style="font-family: monospace; color: #b91c1c; font-size: 13px;">${escapeHtml(creditNote.credit_note_number)}</strong></div>
        <div style="font-size: 11px; margin-top: 2px;">Date: <strong>${creditNote.credit_date}</strong></div>
        <div style="font-size: 11px; margin-top: 2px;">Original Invoice: <strong style="font-family: monospace;">${escapeHtml(creditNote.original_invoice_number)}</strong></div>
        <div style="font-size: 11px; margin-top: 2px;">Order ID: <strong>${escapeHtml(creditNote.order_id)}</strong></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Issued To (Customer)</div>
        <div style="font-weight: bold;">${escapeHtml(creditNote.customer.customer_name)}</div>
        ${creditNote.customer.company_name ? `<div>${escapeHtml(creditNote.customer.company_name)}</div>` : ''}
        <div>${escapeHtml(creditNote.customer.street_address)}, ${escapeHtml(creditNote.customer.city)} - ${escapeHtml(creditNote.customer.pincode)}</div>
        <div>State: ${escapeHtml(creditNote.customer.state)} (Code: ${escapeHtml(creditNote.customer.state_code)})</div>
        ${creditNote.customer.gstin ? `<div style="font-weight: bold; color: #1e40af;">Buyer GSTIN: ${escapeHtml(creditNote.customer.gstin)}</div>` : ''}
      </div>

      <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Reason for Issuance</div>
          <div style="font-size: 12px; color: #374151;">${escapeHtml(creditNote.reason)}</div>
        </div>
        <div>
          ${qrSvg}
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="text-align: left;">Particulars</th>
          <th style="width: 80px; text-align: center;">HSN</th>
          <th style="width: 120px; text-align: right;">Credit Taxable Value</th>
          <th style="width: 100px; text-align: center;">GST (0%)</th>
          <th style="width: 120px; text-align: right;">Total Refund (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Refund / Price Adjustment against Invoice ${escapeHtml(creditNote.original_invoice_number)}</strong>
            <div style="font-size: 11px; color: #4b5563;">Exempted / Nil-rated Printed Books (Notification No. 2/2017-Central Tax)</div>
          </td>
          <td style="text-align: center; font-family: monospace;">4901</td>
          <td style="text-align: right; font-family: monospace;">₹${creditNote.refund_amount.toFixed(2)}</td>
          <td style="text-align: center; font-size: 11px;">₹0.00</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace; font-size: 13px;">₹${creditNote.refund_amount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-bottom: 16px; font-size: 12px;">
      <strong>Refund Amount in Words:</strong><br/>
      <span style="font-style: italic; color: #b91c1c; font-weight: bold;">${amountInWords}</span>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px;">
      <div style="font-size: 10px; color: #6b7280; max-width: 400px;">
        Note: This statutory Credit Note adjusts the outward supply value reported in GSTR-1 for the relevant tax period under Section 34 of the CGST Act.
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="font-size: 11px; font-weight: bold;">For M.M. BOOK HOUSE</div>
        <div style="margin-top: 40px; border-top: 1px solid #111827; font-size: 10px; padding-top: 2px;">
          Authorized Signatory
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates Statutory Revised Tax Invoice (Item 45)
 */
export function generateRevisedInvoiceHtml(
  originalInvoice: TaxInvoice,
  revisions: {
    revisedInvoiceNumber?: string;
    revisionReason: string;
    updatedCustomerName?: string;
    updatedGstin?: string;
  }
): string {
  const revisedNum = revisions.revisedInvoiceNumber || `${originalInvoice.invoice_number}-REV1`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Revised Tax Invoice - ${escapeHtml(revisedNum)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: system-ui, sans-serif; font-size: 12px; padding: 20px; color: #111827; }
    .banner { background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="banner">
    <strong>REVISED TAX INVOICE (Under Rule 53(1) of CGST Rules, 2017)</strong><br/>
    Revised Number: <strong>${escapeHtml(revisedNum)}</strong> | Original Invoice: <strong>${escapeHtml(originalInvoice.invoice_number)}</strong> (Dated: ${originalInvoice.invoice_date})<br/>
    Reason for Revision: <em>${escapeHtml(revisions.revisionReason)}</em>
  </div>
  <h2>${escapeHtml(originalInvoice.seller.trade_name)}</h2>
  <p>Customer: ${escapeHtml(revisions.updatedCustomerName || originalInvoice.customer.customer_name)}</p>
  ${revisions.updatedGstin ? `<p>Updated Buyer GSTIN: <strong>${escapeHtml(revisions.updatedGstin)}</strong></p>` : ''}
  <p>Amount Payable: ₹${originalInvoice.total_payable_amount.toFixed(2)} (HSN 4901, 0% Nil-Rated)</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
