import { TaxInvoice, Gstr1ReportRow } from '../../types/invoice';

/**
 * Module 14: GSTR-1 Monthly Statutory 10-Column Sales Ledger Export Service
 * (Items 42, 43, 50)
 */

export interface Gstr1Summary {
  totalInvoices: number;
  b2bInvoicesCount: number;
  b2cInvoicesCount: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalInvoiceValue: number;
  hsnSummary: {
    hsnCode: string;
    description: string;
    totalTurnover: number;
    taxRate: string;
  }[];
}

/**
 * Transforms Tax Invoices into 10-Column Statutory GSTR-1 Format (Item 43)
 */
export function generateGstr1Rows(invoices: TaxInvoice[]): Gstr1ReportRow[] {
  return invoices.map((inv) => {
    // Primary HSN from items (default 4901 for printed books)
    const primaryHsn = inv.items.length > 0 ? inv.items[0].hsn_code : '4901';

    return {
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      customer_gstin: inv.customer.gstin && inv.customer.gstin.trim().length === 15 ? inv.customer.gstin.trim() : 'URP',
      customer_state_code: inv.customer.state_code || '19',
      hsn_code: primaryHsn,
      taxable_value: Math.round(inv.total_taxable_amount * 100) / 100,
      cgst_amount: Math.round(inv.total_cgst * 100) / 100,
      sgst_amount: Math.round(inv.total_sgst * 100) / 100,
      igst_amount: Math.round(inv.total_igst * 100) / 100,
      total_amount: Math.round(inv.total_payable_amount * 100) / 100,
    };
  });
}

/**
 * Exports GSTR-1 Data as a clean CSV string for CA / Tax Preparer (Item 50)
 */
export function exportGstr1Csv(rows: Gstr1ReportRow[]): string {
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Customer GSTIN',
    'Customer State Code',
    'HSN Code',
    'Taxable Value',
    'CGST Amount',
    'SGST Amount',
    'IGST Amount',
    'Total Amount',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = [
      escapeCsvValue(row.invoice_number),
      escapeCsvValue(row.invoice_date),
      escapeCsvValue(row.customer_gstin),
      escapeCsvValue(row.customer_state_code),
      escapeCsvValue(row.hsn_code),
      row.taxable_value.toFixed(2),
      row.cgst_amount.toFixed(2),
      row.sgst_amount.toFixed(2),
      row.igst_amount.toFixed(2),
      row.total_amount.toFixed(2),
    ];
    lines.push(values.join(','));
  }

  return lines.join('\r\n');
}

/**
 * Calculates High-level GSTR-1 Summary Aggregates
 */
export function calculateGstr1Summary(rows: Gstr1ReportRow[]): Gstr1Summary {
  let b2bCount = 0;
  let b2cCount = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalInvoiceValue = 0;

  for (const r of rows) {
    if (r.customer_gstin !== 'URP') {
      b2bCount++;
    } else {
      b2cCount++;
    }
    totalTaxableValue += r.taxable_value;
    totalCgst += r.cgst_amount;
    totalSgst += r.sgst_amount;
    totalIgst += r.igst_amount;
    totalInvoiceValue += r.total_amount;
  }

  return {
    totalInvoices: rows.length,
    b2bInvoicesCount: b2bCount,
    b2cInvoicesCount: b2cCount,
    totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100,
    hsnSummary: [
      {
        hsnCode: '4901',
        description: 'Printed Books, brochures, leaflets and similar printed matter',
        totalTurnover: Math.round(totalTaxableValue * 100) / 100,
        taxRate: '0% (Nil-rated / Exempted)',
      },
    ],
  };
}

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
