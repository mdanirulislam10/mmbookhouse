import { ThermalShippingLabelData, PackingSlipData } from '../../types/invoice';
import { generateCode128Svg } from './barcodeGenerator';
import { generateSvgQrCode } from './qrCodeGenerator';

/**
 * 4x6" Thermal Shipping Label Generator (100mm x 150mm)
 * (Items 21, 22, 23, 24, 25, 26, 28, 29)
 */
export function generateThermalShippingLabelHtml(label: ThermalShippingLabelData): string {
  const barcodeSvg = label.barcode_code128_svg || generateCode128Svg(label.awb_tracking_number, 55, 1.8);
  const qrSvg = label.tracking_qr_svg || generateSvgQrCode(`https://mmbookhouse.com/track/${label.awb_tracking_number}`, 75);

  const isCod = label.payment_mode === 'COD';
  const collectableAmount = label.collectable_amount || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label - ${escapeHtml(label.awb_tracking_number)}</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      width: 100mm;
      height: 150mm;
      padding: 4mm;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { width: 100mm; height: 150mm; padding: 3mm; }
      .no-print { display: none !important; }
    }
    .label-box {
      width: 100%;
      height: 100%;
      border: 2px solid #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3mm;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 2mm;
    }
    .courier-name {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .hub-badge {
      border: 2px solid #000000;
      padding: 2px 6px;
      font-weight: 900;
      font-size: 13px;
      background: #000000;
      color: #ffffff;
    }
    .barcode-section {
      text-align: center;
      padding: 2mm 0;
      border-bottom: 1.5px solid #000000;
    }
    .payment-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #000000;
      padding: 2mm 0;
    }
    .payment-box {
      border: 2px solid #000000;
      padding: 3px 8px;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .cod-box {
      background: #000000;
      color: #ffffff;
    }
    .prepaid-box {
      background: #ffffff;
      color: #000000;
    }
    .address-section {
      border-bottom: 1.5px solid #000000;
      padding: 2.5mm 0;
      flex-grow: 1;
    }
    .landmark-box {
      margin-top: 2mm;
      padding: 2px 4px;
      border: 1px dashed #000000;
      font-weight: 700;
      font-size: 11px;
    }
    .pincode-badge {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      margin-top: 1.5mm;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 2mm;
    }
    .rto-box {
      font-size: 8.5px;
      max-width: 68mm;
      line-height: 1.2;
    }
    .no-print-bar {
      margin-bottom: 8px;
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="no-print-bar no-print">
    <button class="btn" onclick="window.print()">🖨️ Print 4x6" Thermal Label</button>
  </div>

  <div class="label-box">
    <!-- Header -->
    <div class="header-row">
      <div>
        <div class="courier-name">${escapeHtml(label.courier_name)}</div>
        <div style="font-size: 9px; font-weight: bold;">STANDARD DELIVERY</div>
      </div>
      <div class="hub-badge">MALDA / CCU</div>
    </div>

    <!-- Barcode Section -->
    <div class="barcode-section">
      ${barcodeSvg}
      <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-top: 2px; font-family: monospace;">
        <span>ORD: <strong>${escapeHtml(label.order_id)}</strong></span>
        <span>INV: <strong>${escapeHtml(label.invoice_number)}</strong></span>
      </div>
    </div>

    <!-- Payment & OTP Row (Item 25 & 29) -->
    <div class="payment-badge-row">
      <div class="payment-box ${isCod ? 'cod-box' : 'prepaid-box'}">
        ${isCod ? `COD COLLECT: ₹${collectableAmount.toFixed(0)}` : 'PREPAID'}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; font-weight: 900;">WT: ${label.weight_kg.toFixed(2)} KG</div>
        ${label.otp_badge ? `<div style="font-size: 9px; font-weight: 800; border: 1px solid #000; padding: 1px 4px; margin-top: 2px;">${escapeHtml(label.otp_badge)}</div>` : ''}
      </div>
    </div>

    <!-- Deliver To Address (Item 23) -->
    <div class="address-section">
      <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase;">SHIP TO:</div>
      <div style="font-size: 13px; font-weight: 800; margin-top: 1mm;">${escapeHtml(label.recipient_name)}</div>
      <div style="margin-top: 1mm; font-size: 11px;">${escapeHtml(label.recipient_address)}</div>
      
      ${label.recipient_landmark ? `
      <div class="landmark-box">
        LANDMARK: ${escapeHtml(label.recipient_landmark)}
      </div>` : ''}

      <div style="margin-top: 1mm;">
        ${escapeHtml(label.recipient_city)}, ${escapeHtml(label.recipient_district)}, ${escapeHtml(label.recipient_state)}
      </div>
      
      <div class="pincode-badge">
        PIN: ${escapeHtml(label.recipient_pincode)}
      </div>
      
      <div style="font-weight: 700; margin-top: 1mm; font-size: 11.5px;">
        TEL: ${escapeHtml(label.recipient_phone)}
      </div>
    </div>

    <!-- Footer: RTO Box & QR (Item 24) -->
    <div class="footer-row">
      <div class="rto-box">
        <strong>RETURN IF UNDELIVERED TO (RTO):</strong><br/>
        ${escapeHtml(label.seller_return_address)}
      </div>
      <div>
        ${qrSvg}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * A5 Warehouse Packing Slip Generator (Item 30)
 */
export function generatePackingSlipHtml(slip: PackingSlipData): string {
  const itemRows = slip.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">[ &nbsp; ]</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #d1d5db;">
          <div style="font-weight: bold; font-size: 13px;">${escapeHtml(item.title)}</div>
          ${item.title_bn ? `<div style="color: #4b5563; font-size: 11px;">${escapeHtml(item.title_bn)}</div>` : ''}
          ${item.author ? `<div style="color: #6b7280; font-size: 10.5px;">লেখক: ${escapeHtml(item.author)}</div>` : ''}
          ${item.isbn13 ? `<div style="font-family: monospace; font-size: 10px; color: #9ca3af;">ISBN: ${escapeHtml(item.isbn13)}</div>` : ''}
        </td>
        <td style="padding: 8px; text-align: center; font-size: 14px; font-weight: 900; border: 1px solid #d1d5db;">${item.quantity}</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db; font-family: monospace;">RACK-B2</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Packing Slip - ${escapeHtml(slip.order_id)}</title>
  <style>
    @page { size: A5; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #111827; padding: 12px; }
    @media print { .no-print { display: none !important; } }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .table th { background: #f3f4f6; padding: 8px; border: 1px solid #d1d5db; font-size: 11px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px;">
    <button onclick="window.print()" style="padding: 6px 12px; font-weight: bold; cursor: pointer;">🖨️ Print A5 Packing Slip</button>
  </div>

  <div style="border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h1 style="font-size: 18px; font-weight: 900;">M.M. BOOK HOUSE - WAREHOUSE PICK LIST</h1>
      <p style="font-size: 11px; color: #4b5563;">Order ID: <strong>${escapeHtml(slip.order_id)}</strong> | Invoice: <strong>${escapeHtml(slip.invoice_number)}</strong></p>
    </div>
    <div style="border: 2px solid #111827; padding: 4px 8px; font-weight: 900;">
      ${escapeHtml(slip.delivery_speed || 'STANDARD')}
    </div>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px;">
    <div>গ্রাহক: <strong>${escapeHtml(slip.customer_name)}</strong></div>
    ${slip.packer_note ? `<div style="color: #b91c1c; font-weight: bold; margin-top: 2px;">নোট: ${escapeHtml(slip.packer_note)}</div>` : ''}
  </div>

  <table class="table">
    <thead>
      <tr>
        <th style="width: 40px;">Pick</th>
        <th style="width: 35px;">Sl</th>
        <th>Book Title & Details</th>
        <th style="width: 50px;">Qty</th>
        <th style="width: 80px;">Bin / Rack</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="margin-top: 24px; display: flex; justify-content: space-between; border-top: 1px dashed #9ca3af; padding-top: 12px; font-size: 11px;">
    <div>Picker Initial: __________________</div>
    <div>Packer & Weight Check: __________________</div>
    <div>Dispatch QC: Verified [ &nbsp; ]</div>
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
