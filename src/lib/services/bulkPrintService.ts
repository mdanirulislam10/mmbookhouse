import { ThermalShippingLabelData, TaxInvoice } from '../../types/invoice';
import { generateCode128Svg } from './barcodeGenerator';
import { generateSvgQrCode } from './qrCodeGenerator';

/**
 * Bulk Multi-Order Shipping Label Merging (Item 27)
 * Generates continuous thermal spool document with explicit page boundaries
 */
export function mergeThermalLabelsHtml(labels: ThermalShippingLabelData[]): string {
  const renderedLabels = labels.map((label, index) => {
    const barcodeSvg = label.barcode_code128_svg || generateCode128Svg(label.awb_tracking_number, 50, 1.7);
    const qrSvg = label.tracking_qr_svg || generateSvgQrCode(`https://mmbookhouse.com/track/${label.awb_tracking_number}`, 70);
    const isCod = label.payment_mode === 'COD';
    const isLast = index === labels.length - 1;

    return `
    <div class="label-page ${isLast ? 'last-page' : ''}">
      <div class="label-box">
        <!-- Header -->
        <div class="header-row">
          <div>
            <div class="courier-name">${escapeHtml(label.courier_name)}</div>
            <div style="font-size: 8.5px; font-weight: bold;">SURFACE / AIR DISPATCH</div>
          </div>
          <div class="hub-badge">MALDA / CCU</div>
        </div>

        <!-- Barcode Section -->
        <div class="barcode-section">
          ${barcodeSvg}
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px; font-family: monospace;">
            <span>ORD: <strong>${escapeHtml(label.order_id)}</strong></span>
            <span>INV: <strong>${escapeHtml(label.invoice_number)}</strong></span>
          </div>
        </div>

        <!-- Payment & OTP -->
        <div class="payment-badge-row">
          <div class="payment-box ${isCod ? 'cod-box' : 'prepaid-box'}">
            ${isCod ? `COD: ₹${(label.collectable_amount || 0).toFixed(0)}` : 'PREPAID'}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; font-weight: 900;">WT: ${label.weight_kg.toFixed(2)} KG</div>
            ${label.otp_badge ? `<div style="font-size: 8.5px; font-weight: 800; border: 1px solid #000; padding: 1px 3px; margin-top: 1px;">${escapeHtml(label.otp_badge)}</div>` : ''}
          </div>
        </div>

        <!-- Recipient Address -->
        <div class="address-section">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase;">SHIP TO:</div>
          <div style="font-size: 13px; font-weight: 800; margin-top: 1mm;">${escapeHtml(label.recipient_name)}</div>
          <div style="margin-top: 1mm; font-size: 10.5px;">${escapeHtml(label.recipient_address)}</div>
          
          ${label.recipient_landmark ? `
          <div class="landmark-box">
            LANDMARK: ${escapeHtml(label.recipient_landmark)}
          </div>` : ''}

          <div style="margin-top: 1mm; font-size: 10.5px;">
            ${escapeHtml(label.recipient_city)}, ${escapeHtml(label.recipient_district)}, ${escapeHtml(label.recipient_state)}
          </div>

          <div class="pincode-badge">
            PIN: ${escapeHtml(label.recipient_pincode)}
          </div>

          <div style="font-weight: 700; margin-top: 1mm; font-size: 11px;">
            TEL: ${escapeHtml(label.recipient_phone)}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-row">
          <div class="rto-box">
            <strong>RETURN IF UNDELIVERED (RTO):</strong><br/>
            ${escapeHtml(label.seller_return_address)}
          </div>
          <div>
            ${qrSvg}
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bulk Shipping Labels (${labels.length} Orders)</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; }
    }
    .label-page {
      width: 100mm;
      height: 150mm;
      page-break-after: always;
      break-after: page;
      padding: 3mm;
      display: flex;
      flex-direction: column;
    }
    .label-page.last-page {
      page-break-after: auto;
      break-after: auto;
    }
    .label-box {
      width: 100%;
      height: 100%;
      border: 2px solid #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.5mm;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 1.5mm;
    }
    .courier-name { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
    .hub-badge { border: 2px solid #000000; padding: 1.5px 5px; font-weight: 900; font-size: 12px; background: #000000; color: #ffffff; }
    .barcode-section { text-align: center; padding: 1.5mm 0; border-bottom: 1.5px solid #000000; }
    .payment-badge-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000000; padding: 1.5mm 0; }
    .payment-box { border: 2px solid #000000; padding: 2px 6px; font-size: 13px; font-weight: 900; text-transform: uppercase; }
    .cod-box { background: #000000; color: #ffffff; }
    .prepaid-box { background: #ffffff; color: #000000; }
    .address-section { border-bottom: 1.5px solid #000000; padding: 2mm 0; flex-grow: 1; }
    .landmark-box { margin-top: 1.5mm; padding: 2px 4px; border: 1px dashed #000000; font-weight: 700; font-size: 10.5px; }
    .pincode-badge { font-size: 17px; font-weight: 900; letter-spacing: 1px; margin-top: 1mm; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.5mm; }
    .rto-box { font-size: 8px; max-width: 68mm; line-height: 1.15; }
  </style>
</head>
<body>
  <div class="no-print" style="padding: 12px; background: #f3f4f6; border-bottom: 1px solid #d1d5db; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>Bulk Print:</strong> ${labels.length} Shipping Labels Ready</div>
    <button onclick="window.print()" style="padding: 8px 16px; background: #000; color: #fff; font-weight: bold; border-radius: 4px; cursor: pointer;">
      🖨️ Print All ${labels.length} Labels
    </button>
  </div>
  ${renderedLabels}
</body>
</html>`;
}

/**
 * 2" (58mm) and 3" (80mm) POS Counter Thermal Receipt Generator (Item 38)
 */
export function generatePosCounterReceiptHtml(invoice: TaxInvoice, widthMm: 58 | 80 = 80): string {
  const qrSvg = generateSvgQrCode(invoice.verification_qr_url, widthMm === 58 ? 80 : 100);

  const itemLines = invoice.items
    .map((item) => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
        <div style="font-weight: bold; max-width: ${widthMm === 58 ? '34mm' : '52mm'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(item.book_title)}
        </div>
        <div style="font-family: monospace; font-weight: bold;">₹${item.total_item_amount.toFixed(2)}</div>
      </div>
      <div style="font-size: 10px; color: #4b5563; display: flex; justify-content: space-between;">
        <span>${item.quantity} x ₹${item.unit_selling_price.toFixed(2)} [HSN:${item.hsn_code}]</span>
        <span>${item.unit_mrp > item.unit_selling_price ? `(MRP ₹${item.unit_mrp})` : ''}</span>
      </div>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>POS Receipt - ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    @page {
      size: ${widthMm}mm auto;
      margin: 2mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, system-ui;
      width: ${widthMm}mm;
      padding: 2mm;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      .no-print { display: none !important; }
      body { width: ${widthMm}mm; padding: 0; margin: 0; }
    }
    .dashed-line {
      border-top: 1px dashed #000000;
      margin: 4px 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 8px;">
    <button onclick="window.print()" style="padding: 4px 10px; font-weight: bold; cursor: pointer; font-family: sans-serif;">
      🖨️ Print POS Receipt (${widthMm}mm)
    </button>
  </div>

  <div class="text-center">
    <div style="font-size: 15px; font-weight: 900;">${escapeHtml(invoice.seller.trade_name)}</div>
    <div style="font-size: 10px;">${escapeHtml(invoice.seller.legal_name)}</div>
    <div style="font-size: 9.5px;">Netaji Subhash Road, Malda - 732101</div>
    <div style="font-size: 9.5px;">GSTIN: ${escapeHtml(invoice.seller.gstin)}</div>
    <div style="font-size: 9.5px;">Ph: ${escapeHtml(invoice.seller.phone)}</div>
  </div>

  <div class="dashed-line"></div>

  <div style="font-size: 10px; display: flex; justify-content: space-between;">
    <span>Bill: <strong>${escapeHtml(invoice.invoice_number)}</strong></span>
    <span>${invoice.invoice_date}</span>
  </div>
  <div style="font-size: 10px;">Cust: ${escapeHtml(invoice.customer.customer_name)} (${invoice.customer.customer_phone})</div>

  <div class="dashed-line"></div>
  <div style="font-size: 10.5px; font-weight: bold; text-transform: uppercase;">ITEMS PURCHASED (HSN 4901):</div>

  ${itemLines}

  <div class="dashed-line"></div>

  <div style="display: flex; justify-content: space-between; font-size: 11px;">
    <span>Subtotal MRP:</span>
    <span style="font-family: monospace;">₹${invoice.subtotal_mrp.toFixed(2)}</span>
  </div>
  <div style="display: flex; justify-content: space-between; font-size: 11px;">
    <span>Discount Savings:</span>
    <span style="font-family: monospace;">-₹${(invoice.subtotal_mrp - invoice.subtotal_selling_price).toFixed(2)}</span>
  </div>
  ${invoice.coupon_discount > 0 ? `
  <div style="display: flex; justify-content: space-between; font-size: 11px;">
    <span>Coupon Promo:</span>
    <span style="font-family: monospace;">-₹${invoice.coupon_discount.toFixed(2)}</span>
  </div>` : ''}
  <div style="display: flex; justify-content: space-between; font-size: 11px;">
    <span>GST (0% Nil-Rated):</span>
    <span style="font-family: monospace;">₹0.00</span>
  </div>

  <div class="dashed-line"></div>

  <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900;">
    <span>TOTAL PAID:</span>
    <span style="font-family: monospace;">₹${invoice.total_payable_amount.toFixed(2)}</span>
  </div>

  <div style="font-size: 10px; margin-top: 4px;">
    Payment: <strong style="text-transform: uppercase;">${escapeHtml(invoice.payment_method)}</strong> (${invoice.payment_status})
    ${invoice.utr_or_rrn ? `<br/>Ref UTR: ${escapeHtml(invoice.utr_or_rrn)}` : ''}
  </div>

  <div class="dashed-line"></div>

  <div class="text-center" style="margin-top: 6px;">
    ${qrSvg}
    <div style="font-size: 8.5px; margin-top: 2px;">Scan for Digital Bill</div>
  </div>

  <div class="dashed-line"></div>

  <div class="text-center" style="font-size: 10px; font-weight: bold; margin-top: 4px;">
    ধন্যবাদ! আবার আসবেন।<br/>
    Thank you for visiting!
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
