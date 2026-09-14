'use client';

import React, { useState } from 'react';
import { TaxInvoice } from '../../types/invoice';
import { Printer, ArrowLeft, Receipt } from 'lucide-react';
import { generateSvgQrCode } from '../../lib/services/qrCodeGenerator';

interface CounterPosReceiptProps {
  invoice: TaxInvoice;
  onBack?: () => void;
}

export const CounterPosReceipt: React.FC<CounterPosReceiptProps> = ({ invoice, onBack }) => {
  const [widthMm, setWidthMm] = useState<58 | 80>(80);

  const qrSvg = generateSvgQrCode(invoice.verification_qr_url, widthMm === 58 ? 80 : 100);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-4 flex flex-col items-center">
      {/* Control Bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between print:hidden bg-white p-3 rounded-lg shadow border border-slate-300">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <div className="flex rounded border border-slate-300 p-0.5 text-xs">
            <button
              onClick={() => setWidthMm(58)}
              className={`px-2 py-0.5 rounded ${widthMm === 58 ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
            >
              2" (58mm)
            </button>
            <button
              onClick={() => setWidthMm(80)}
              className={`px-2 py-0.5 rounded ${widthMm === 80 ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
            >
              3" (80mm)
            </button>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Receipt
        </button>
      </div>

      {/* POS Thermal Receipt */}
      <div
        className={`bg-white text-black p-4 font-mono shadow-2xl print:shadow-none print:m-0 border border-slate-300 print:border-none ${widthMm === 58 ? 'w-[58mm] text-[10px]' : 'w-[80mm] text-xs'}`}
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-base font-black tracking-tight">{invoice.seller.trade_name}</div>
          <div className="text-[10px]">{invoice.seller.legal_name}</div>
          <div className="text-[9.5px]">Netaji Subhash Road, Malda - 732101</div>
          <div className="text-[9.5px]">GSTIN: {invoice.seller.gstin}</div>
          <div className="text-[9.5px]">Ph: {invoice.seller.phone}</div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Invoice Meta */}
        <div className="flex justify-between text-[10px]">
          <span>Bill: <strong>{invoice.invoice_number}</strong></span>
          <span>{invoice.invoice_date}</span>
        </div>
        <div className="text-[10px]">
          Cust: {invoice.customer.customer_name} ({invoice.customer.customer_phone})
        </div>

        <div className="border-t border-dashed border-black my-2"></div>
        <div className="font-bold text-[10px] uppercase">ITEMS PURCHASED (HSN 4901):</div>

        {/* Items */}
        <div className="space-y-1.5 mt-1">
          {invoice.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between font-bold">
                <span className="truncate max-w-[70%]">{item.book_title}</span>
                <span>₹{item.total_item_amount.toFixed(2)}</span>
              </div>
              <div className="text-[9.5px] text-slate-600 flex justify-between">
                <span>{item.quantity} x ₹{item.unit_selling_price.toFixed(2)} [HSN:{item.hsn_code}]</span>
                {item.unit_mrp > item.unit_selling_price && (
                  <span>(MRP ₹{item.unit_mrp})</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Totals */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal MRP:</span>
            <span>₹{invoice.subtotal_mrp.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Savings Discount:</span>
            <span>-₹{(invoice.subtotal_mrp - invoice.subtotal_selling_price).toFixed(2)}</span>
          </div>
          {invoice.coupon_discount > 0 && (
            <div className="flex justify-between">
              <span>Coupon Promo:</span>
              <span>-₹{invoice.coupon_discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST (0% Nil-Rated):</span>
            <span>₹0.00</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Grand Total */}
        <div className="flex justify-between text-sm font-black">
          <span>TOTAL PAID:</span>
          <span>₹{invoice.total_payable_amount.toFixed(2)}</span>
        </div>

        <div className="text-[10px] mt-1">
          Payment: <strong className="uppercase">{invoice.payment_method}</strong> ({invoice.payment_status})
          {invoice.utr_or_rrn && (
            <div>Ref UTR: {invoice.utr_or_rrn}</div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* QR Code */}
        <div className="flex flex-col items-center my-1.5">
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="text-[8.5px] text-slate-500 mt-1">Scan for Digital Bill</div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-center font-bold text-[10px]">
          ধন্যবাদ! আবার আসবেন।<br/>
          Thank you for visiting!
        </div>
      </div>
    </div>
  );
};
