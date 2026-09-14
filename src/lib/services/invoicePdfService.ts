import { TaxInvoice } from '../../types/invoice';
import { generateSvgQrCode } from './qrCodeGenerator';

/**
 * Amazon-Pattern Vector PDF & HTML Print Generator
 * (Items 2, 6, 7, 8, 9, 11, 13, 16, 17, 20, 40, 49)
 */
export function generateInvoiceHtml(
  invoice: TaxInvoice,
  copyType: 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' = 'ORIGINAL'
): string {
  const qrSvg = generateSvgQrCode(invoice.verification_qr_url, 110);
  const copyLabel = 
    copyType === 'ORIGINAL' 
      ? 'ORIGINAL FOR RECIPIENT' 
      : copyType === 'DUPLICATE' 
        ? 'DUPLICATE FOR TRANSPORTER' 
        : 'TRIPLICATE FOR SUPPLIER';

  const itemsRows = invoice.items
    .map(
      (item, idx) => `
      <tr class="item-row">
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="font-bold text-gray-900">${escapeHtml(item.book_title)}</div>
          ${item.book_title_bn ? `<div class="text-xs text-gray-600 font-bengali">${escapeHtml(item.book_title_bn)}</div>` : ''}
          ${item.author_name ? `<div class="text-xs text-gray-500">লেখক: ${escapeHtml(item.author_name)}</div>` : ''}
          ${item.isbn13 ? `<div class="text-xs text-gray-400">ISBN: ${escapeHtml(item.isbn13)}</div>` : ''}
        </td>
        <td class="text-center font-mono">${escapeHtml(item.hsn_code)}</td>
        <td class="text-center font-semibold">${item.quantity}</td>
        <td class="text-right font-mono">₹${item.unit_mrp.toFixed(2)}</td>
        <td class="text-right font-mono">₹${item.unit_selling_price.toFixed(2)}</td>
        <td class="text-right font-mono">₹${(item.taxable_value).toFixed(2)}</td>
        <td class="text-center text-xs">
          ${invoice.is_interstate 
            ? `IGST: 0%<br/><span class="text-gray-500">₹0.00</span>` 
            : `CGST: 0% (₹0)<br/>SGST: 0% (₹0)`
          }
        </td>
        <td class="text-right font-mono font-bold">₹${item.total_item_amount.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap');

    @page {
      size: A4;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #111827;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .font-bengali {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      border: 1px solid #d1d5db;
      background: #ffffff;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-container {
        border: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #111827;
    }

    .brand-sub {
      font-size: 11px;
      color: #4b5563;
      margin-top: 2px;
    }

    .copy-badge {
      display: inline-block;
      border: 1px solid #374151;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f3f4f6;
      border-radius: 3px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 0.6fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-card {
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
      border-radius: 4px;
      background: #f9fafb;
    }

    .card-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    .data-table th {
      background: #f3f4f6;
      color: #1f2937;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      padding: 8px 6px;
      border: 1px solid #d1d5db;
    }

    .data-table td {
      padding: 8px 6px;
      border: 1px solid #e5e7eb;
      font-size: 11.5px;
      vertical-align: top;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, monospace; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }

    .summary-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }

    .summary-table td {
      padding: 5px 8px;
      font-size: 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .summary-table .total-row td {
      font-weight: 800;
      font-size: 14px;
      background: #f9fafb;
      border-top: 2px solid #1f2937;
      border-bottom: 2px solid #1f2937;
    }

    .declaration-box {
      border: 1px dashed #9ca3af;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 16px;
    }

    .signatory-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 12px;
    }

    .action-bar {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: background 0.15s;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #1f2937;
      border: 1px solid #d1d5db;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="btn btn-secondary" onclick="window.history.back()">Back</button>
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Download PDF</button>
  </div>

  <div class="invoice-container">
    <!-- Header -->
    <div class="header-bar">
      <div>
        <div class="brand-title">${escapeHtml(invoice.seller.trade_name)}</div>
        <div class="brand-sub">${escapeHtml(invoice.seller.legal_name)} | Netaji Subhash Road, English Bazar, Malda, WB - 732101</div>
        <div class="brand-sub">GSTIN: <strong>${escapeHtml(invoice.seller.gstin)}</strong> | PAN: <strong>${escapeHtml(invoice.seller.pan)}</strong> | State: 19-West Bengal</div>
      </div>
      <div style="text-align: right;">
        <span class="copy-badge">${copyLabel}</span>
        <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 6px;">TAX INVOICE</div>
        <div style="font-size: 10px; color: #6b7280;">(Under Rule 46 of CGST Rules, 2017)</div>
      </div>
    </div>

    <!-- Metadata Section -->
    <div class="grid-3">
      <div class="info-card">
        <div class="card-heading">Sold By (Supplier)</div>
        <div class="font-bold">${escapeHtml(invoice.seller.trade_name)}</div>
        <div>${escapeHtml(invoice.seller.address_line1)}</div>
        <div>${escapeHtml(invoice.seller.city)}, ${escapeHtml(invoice.seller.district)} - ${escapeHtml(invoice.seller.pincode)}</div>
        <div>State: ${escapeHtml(invoice.seller.state)} (Code: ${escapeHtml(invoice.seller.state_code)})</div>
        <div style="margin-top: 4px;">Phone: ${escapeHtml(invoice.seller.phone)}</div>
        <div>Email: ${escapeHtml(invoice.seller.email)}</div>
      </div>

      <div class="info-card">
        <div class="card-heading">Billing & Shipping Details</div>
        <div class="font-bold">${escapeHtml(invoice.customer.customer_name)}</div>
        ${invoice.customer.company_name ? `<div class="font-semibold text-blue-700">${escapeHtml(invoice.customer.company_name)}</div>` : ''}
        <div>${escapeHtml(invoice.customer.street_address)}</div>
        ${invoice.customer.landmark ? `<div>Landmark: ${escapeHtml(invoice.customer.landmark)}</div>` : ''}
        <div>${escapeHtml(invoice.customer.city)}, ${escapeHtml(invoice.customer.district)} - ${escapeHtml(invoice.customer.pincode)}</div>
        <div>State: ${escapeHtml(invoice.customer.state)} (Code: ${escapeHtml(invoice.customer.state_code)})</div>
        <div>Phone: ${escapeHtml(invoice.customer.customer_phone)}</div>
        ${invoice.customer.gstin ? `<div class="font-bold" style="color: #1e40af; margin-top: 3px;">Buyer GSTIN: ${escapeHtml(invoice.customer.gstin)}</div>` : '<div style="font-size: 10px; color: #6b7280;">Customer: Unregistered (B2C)</div>'}
      </div>

      <div class="info-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
        <div>
          <div class="card-heading">Invoice Details</div>
          <div style="font-size: 11px;">Invoice No: <br/><strong class="font-mono" style="font-size: 12px; color: #1e3a8a;">${escapeHtml(invoice.invoice_number)}</strong></div>
          <div style="font-size: 11px; margin-top: 4px;">Date: <strong>${invoice.invoice_date}</strong></div>
          <div style="font-size: 11px; margin-top: 2px;">Order ID: <strong>${escapeHtml(invoice.order_id)}</strong></div>
        </div>
        <div style="margin-top: 8px;">
          ${qrSvg}
          <div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Scan to Verify</div>
        </div>
      </div>
    </div>

    <!-- Reverse Charge Note (Item 8) -->
    <div style="font-size: 11px; margin-bottom: 12px; background: #fefce8; border: 1px solid #fef08a; padding: 6px 10px; border-radius: 4px;">
      <strong>Reverse Charge Mechanism:</strong> Whether tax is payable on Reverse Charge basis: <strong>NO</strong>
    </div>

    <!-- Itemized Table (Item 7 & 20) -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">Sl</th>
          <th>Description of Goods (Books)</th>
          <th style="width: 60px;">HSN</th>
          <th style="width: 40px;">Qty</th>
          <th style="width: 70px;">MRP</th>
          <th style="width: 70px;">Rate</th>
          <th style="width: 80px;">Taxable</th>
          <th style="width: 100px;">Tax Rate</th>
          <th style="width: 85px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Summary Box & Words (Item 6) -->
    <div class="summary-grid">
      <div>
        <div style="font-size: 11.5px; margin-bottom: 10px;">
          <strong>Amount in Words:</strong><br/>
          <span style="font-style: italic; color: #1e3a8a; font-weight: 600;">${escapeHtml(invoice.amount_in_words)}</span>
        </div>

        <div style="font-size: 11px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 10px; border-radius: 4px; margin-bottom: 10px;">
          <div style="font-weight: 700; margin-bottom: 4px;">Payment & Settlement Info:</div>
          <div>Payment Mode: <strong style="text-transform: uppercase;">${escapeHtml(invoice.payment_method)}</strong> (${escapeHtml(invoice.payment_status)})</div>
          ${invoice.utr_or_rrn ? `<div>Bank Ref / UTR: <strong class="font-mono">${escapeHtml(invoice.utr_or_rrn)}</strong></div>` : ''}
        </div>

        <!-- Statutory Declaration (Item 11) -->
        <div class="declaration-box">
          <strong>Statutory Declaration:</strong><br/>
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          Printed books are Nil-rated / exempt from Goods and Services Tax under HSN Code 4901 (Notification No. 2/2017-Central Tax (Rate)).
        </div>
      </div>

      <div>
        <table class="summary-table">
          <tr>
            <td>Total MRP:</td>
            <td class="text-right font-mono">₹${invoice.subtotal_mrp.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Catalogue Discount:</td>
            <td class="text-right font-mono text-green-700">-₹${(invoice.subtotal_mrp - invoice.subtotal_selling_price).toFixed(2)}</td>
          </tr>
          ${invoice.coupon_discount > 0 ? `
          <tr>
            <td>Coupon Promo Discount:</td>
            <td class="text-right font-mono text-green-700">-₹${invoice.coupon_discount.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td>Shipping & Delivery Charge:</td>
            <td class="text-right font-mono">${invoice.shipping_fee > 0 ? `₹${invoice.shipping_fee.toFixed(2)}` : '<span style="color: #16a34a; font-weight: 600;">FREE</span>'}</td>
          </tr>
          ${invoice.cod_handling_fee && invoice.cod_handling_fee > 0 ? `
          <tr>
            <td>COD Handling Fee:</td>
            <td class="text-right font-mono">₹${invoice.cod_handling_fee.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td>Total CGST (0%):</td>
            <td class="text-right font-mono">₹0.00</td>
          </tr>
          <tr>
            <td>Total SGST (0%):</td>
            <td class="text-right font-mono">₹0.00</td>
          </tr>
          <tr>
            <td>Total IGST (0%):</td>
            <td class="text-right font-mono">₹0.00</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total Payable:</td>
            <td class="text-right font-mono">₹${invoice.total_payable_amount.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Signatory Box (Item 13) -->
        <div class="signatory-box">
          <div></div>
          <div style="text-align: center;">
            <div style="font-size: 11px; font-weight: 700;">For M.M. BOOK HOUSE</div>
            <div style="margin-top: 36px; border-top: 1px solid #4b5563; font-size: 10.5px; padding-top: 2px;">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; text-align: center; font-size: 9.5px; color: #9ca3af;">
      This is a computer-generated tax invoice and requires no physical signature. Registered Office: Netaji Subhash Road, English Bazar, Malda, WB - 732101.
    </div>
  </div>
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
