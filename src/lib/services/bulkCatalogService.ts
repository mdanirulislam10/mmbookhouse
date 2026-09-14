import { BookInventoryItem, AdminOrderSummary } from '../../types/sellerCentral';
import { bulkBookImportRowSchema } from '../validations/sellerCentral';
import { defaultMerchantInventoryService, MerchantInventoryService } from './merchantInventoryService';

/**
 * Module 19: Bulk Catalog Operations, CSV Importer & Price Modifier Service
 * 
 * Complies with:
 * - Item 15: 1-Click Bulk 500+ Books Excel/CSV Import with Error Preview
 * - Item 16: Bulk Price Modifier Tool (e.g., Increase Chhaya discount by 5%)
 * - Item 30: Custom Date Range Order & Inventory CSV Export
 * - Item 49: Cursor-based Lightweight Grid Pagination (20 items/page)
 */

export interface FailedImportRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

export interface BulkImportResult {
  totalRows: number;
  validRows: Array<Omit<BookInventoryItem, 'id' | 'created_at' | 'updated_at'>>;
  failedRows: FailedImportRow[];
}

export class BulkCatalogService {
  private invService: MerchantInventoryService;

  constructor(invService = defaultMerchantInventoryService) {
    this.invService = invService;
  }

  /**
   * Item 15: Parses raw CSV text, validates against schema, highlights errors row-by-row
   */
  public parseAndValidateCsv(csvText: string): BulkImportResult {
    const lines = csvText
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { totalRows: 0, validRows: [], failedRows: [] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const validRows: Array<Omit<BookInventoryItem, 'id' | 'created_at' | 'updated_at'>> = [];
    const failedRows: FailedImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const rowData: Record<string, string> = {};

      headers.forEach((h, idx) => {
        rowData[h] = cols[idx] || '';
      });

      const validation = bulkBookImportRowSchema.safeParse(rowData);

      if (validation.success) {
        const d = validation.data;
        const discount_percent = Math.round(((d.mrp - d.selling_price) / d.mrp) * 100);

        validRows.push({
          sku: d.sku,
          isbn: d.isbn,
          title: d.title,
          title_bn: d.title_bn,
          author: d.author,
          publisher: d.publisher,
          categories: d.categories,
          mrp: d.mrp,
          selling_price: d.selling_price,
          wholesale_cost_price: d.wholesale_cost_price,
          discount_percent,
          stock_quantity: d.stock_quantity,
          low_stock_threshold: 5,
          weight_grams: d.weight_grams,
          rack_location: d.rack_location || 'Rack General',
          is_active: true,
          status: d.stock_quantity > 0 ? 'active' : 'out_of_stock',
        });
      } else {
        const errors = (validation.error.issues || []).map((e) => `${e.path.join('.')}: ${e.message}`);
        failedRows.push({
          rowNumber: i + 1,
          data: rowData,
          errors,
        });
      }
    }

    return {
      totalRows: lines.length - 1,
      validRows,
      failedRows,
    };
  }

  /**
   * Commit valid rows into the inventory
   */
  public commitImport(validRows: Array<Omit<BookInventoryItem, 'id' | 'created_at' | 'updated_at'>>): number {
    let count = 0;
    for (const row of validRows) {
      this.invService.addBook(row);
      count++;
    }
    return count;
  }

  /**
   * Item 16: Bulk Price Modifier Tool
   * Allows bulk discount increase or pricing updates for an entire publisher or category
   */
  public modifyBulkPrices(
    criteria: { publisher?: string; category?: string },
    adjustment: {
      type: 'increase_discount_percent' | 'set_discount_percent';
      value: number; // e.g. 5 for +5% discount, or 25 for setting flat 25% discount
    }
  ): { affectedCount: number; updatedBooks: BookInventoryItem[] } {
    const allBooks = this.invService.listBooks();
    const updatedBooks: BookInventoryItem[] = [];

    for (const book of allBooks) {
      const matchPublisher = !criteria.publisher || book.publisher === criteria.publisher;
      const matchCategory = !criteria.category || book.categories.includes(criteria.category);

      if (matchPublisher && matchCategory) {
        let newDiscount = book.discount_percent;

        if (adjustment.type === 'increase_discount_percent') {
          newDiscount = Math.min(80, book.discount_percent + adjustment.value); // cap at 80%
        } else if (adjustment.type === 'set_discount_percent') {
          newDiscount = Math.min(80, Math.max(0, adjustment.value));
        }

        const newSellingPrice = Math.round(book.mrp * (1 - newDiscount / 100));
        const updated = this.invService.updateBook(book.id, {
          selling_price: newSellingPrice,
          discount_percent: newDiscount,
        });

        if (updated) {
          updatedBooks.push(updated);
        }
      }
    }

    return {
      affectedCount: updatedBooks.length,
      updatedBooks,
    };
  }

  /**
   * Convenience wrapper for 1-Click publisher or category discount modifier
   */
  public applyBulkDiscountModifier(options: {
    publisher?: string;
    category?: string;
    discount_percentage_delta: number;
  }): { success: boolean; modifiedCount: number; updatedBooks: BookInventoryItem[] } {
    const res = this.modifyBulkPrices(
      { publisher: options.publisher, category: options.category },
      { type: 'increase_discount_percent', value: options.discount_percentage_delta }
    );
    return {
      success: true,
      modifiedCount: res.affectedCount,
      updatedBooks: res.updatedBooks,
    };
  }


  /**
   * Item 30: Custom Date Range Order CSV Export
   */
  public exportOrdersToCsv(
    orders: AdminOrderSummary[],
    dateRange?: { start?: string; end?: string }
  ): string {
    let filtered = orders;

    if (dateRange?.start) {
      filtered = filtered.filter((o) => o.created_at >= dateRange.start!);
    }
    if (dateRange?.end) {
      filtered = filtered.filter((o) => o.created_at <= dateRange.end!);
    }

    const headers = [
      'Order ID',
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'District',
      'Pincode',
      'Payment Mode',
      'Payment Status',
      'Pipeline Status',
      'Total Amount (INR)',
      'Items Count',
      'AWB Code',
      'Courier',
    ];

    const rows = filtered.map((o) => [
      o.order_id,
      o.order_number,
      o.created_at,
      `"${o.customer_name}"`,
      o.customer_phone,
      o.district,
      o.pincode,
      o.payment_mode,
      o.payment_status,
      o.pipeline_status,
      o.total_amount,
      o.items.length,
      o.awb_code || 'N/A',
      o.courier_name || 'N/A',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export inventory catalog to CSV
   */
  public exportInventoryToCsv(books: BookInventoryItem[]): string {
    const headers = [
      'ID',
      'SKU',
      'ISBN',
      'Title',
      'Bengali Title',
      'Author',
      'Publisher',
      'Categories',
      'MRP',
      'Selling Price',
      'Wholesale Cost',
      'Discount %',
      'Stock',
      'Rack Location',
      'Status',
    ];

    const rows = books.map((b) => [
      b.id,
      b.sku,
      b.isbn,
      `"${b.title}"`,
      `"${b.title_bn}"`,
      `"${b.author}"`,
      `"${b.publisher}"`,
      `"${b.categories.join(';')}"`,
      b.mrp,
      b.selling_price,
      b.wholesale_cost_price || 0,
      b.discount_percent,
      b.stock_quantity,
      `"${b.rack_location || ''}"`,
      b.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Item 49: Cursor-based lightweight grid pagination (20 items per page default)
   */
  public paginateItems<T>(
    items: T[],
    page = 1,
    pageSize = 20
  ): {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const safePage = Math.max(1, page);
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (safePage - 1) * pageSize;
    const data = items.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    };
  }
}

export const defaultBulkCatalogService = new BulkCatalogService();
