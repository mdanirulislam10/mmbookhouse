'use client';

import React, { useState } from 'react';
import { TaxInvoice } from '../../types/invoice';
import { Printer, Download, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';

interface AmazonTaxInvoiceViewProps {
  invoice: TaxInvoice;
  onBack?: () => void;
}

export const AmazonTaxInvoiceView: React.FC<AmazonTaxInvoiceViewProps> = ({ invoice, onBack }) => {
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ORIGINAL');

  const copyLabel = 
    copyType === 'ORIGINAL' 
      ? 'ORIGINAL FOR RECIPIENT' 
      : copyType === 'DUPLICATE' 
        ? 'DUPLICATE FOR TRANSPORTER' 
        : 'TRIPLICATE FOR SUPPLIER';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ফিরে যান (Back)
            </button>
          )}
          <span className="text-sm font-semibold text-slate-900">
            ইনভয়েস প্রিভিউ: <span className="font-mono text-blue-600">{invoice.invoice_number}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Copy Selector */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setCopyType('ORIGINAL')}
              className={`px-2.5 py-1 rounded-md transition ${copyType === 'ORIGINAL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
            >
              Original
            </button>
            <button
              onClick={() => setCopyType('DUPLICATE')}
              className={`px-2.5 py-1 rounded-md transition ${copyType === 'DUPLICATE' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
            >
              Duplicate
            </button>
            <button
              onClick={() => setCopyType('TRIPLICATE')}
              className={`px-2.5 py-1 rounded-md transition ${copyType === 'TRIPLICATE' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}
            >
              Triplicate
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            প্রিন্ট / PDF ডাউনলোড
          </button>
        </div>
      </div>

      {/* Printable Invoice Page */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 shadow-md rounded-lg print:border-none print:shadow-none print:p-0">
        {/* Header Bar */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{invoice.seller.trade_name}</h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">{invoice.seller.legal_name} | Netaji Subhash Road, English Bazar, Malda, WB - 732101</p>
            <p className="text-xs text-slate-600">
              GSTIN: <strong className="font-mono">{invoice.seller.gstin}</strong> | PAN: <strong className="font-mono">{invoice.seller.pan}</strong> | State: 19-West Bengal
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 border border-slate-400 rounded text-slate-800">
              {copyLabel}
            </span>
            <div className="text-lg font-black text-slate-900 mt-1.5">TAX INVOICE</div>
            <div className="text-[10px] text-slate-500">(Under Rule 46 of CGST Rules, 2017)</div>
          </div>
        </div>

        {/* 3-Column Meta Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
          {/* Supplier */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="font-bold text-slate-600 uppercase text-[10px] border-b pb-1 mb-1.5">Sold By (Supplier)</div>
            <div className="font-bold text-slate-900">{invoice.seller.trade_name}</div>
            <div>{invoice.seller.address_line1}</div>
            <div>{invoice.seller.city}, {invoice.seller.district} - {invoice.seller.pincode}</div>
            <div>State: {invoice.seller.state} (Code: {invoice.seller.state_code})</div>
            <div className="mt-1 text-slate-500">Phone: {invoice.seller.phone}</div>
          </div>

          {/* Customer */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="font-bold text-slate-600 uppercase text-[10px] border-b pb-1 mb-1.5">Billing & Shipping Address</div>
            <div className="font-bold text-slate-900">{invoice.customer.customer_name}</div>
            {invoice.customer.company_name && (
              <div className="font-semibold text-blue-700">{invoice.customer.company_name}</div>
            )}
            <div>{invoice.customer.street_address}</div>
            {invoice.customer.landmark && <div>Landmark: {invoice.customer.landmark}</div>}
            <div>{invoice.customer.city}, {invoice.customer.district} - {invoice.customer.pincode}</div>
            <div>State: {invoice.customer.state} (Code: {invoice.customer.state_code})</div>
            <div className="text-slate-500">Phone: {invoice.customer.customer_phone}</div>
            {invoice.customer.gstin ? (
              <div className="mt-1 font-bold text-blue-800">Buyer GSTIN: {invoice.customer.gstin}</div>
            ) : (
              <div className="text-[10px] text-slate-500 mt-1">Consumer (B2C Unregistered)</div>
            )}
          </div>

          {/* Invoice & Order details */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col justify-between items-center text-center">
            <div>
              <div className="font-bold text-slate-600 uppercase text-[10px] border-b pb-1 mb-1.5">Invoice Meta</div>
              <div>ইনভয়েস নং: <strong className="font-mono text-blue-900">{invoice.invoice_number}</strong></div>
              <div className="mt-0.5">তারিখ: <strong>{invoice.invoice_date}</strong></div>
              <div className="mt-0.5">অর্ডার আইডি: <strong className="font-mono">{invoice.order_id}</strong></div>
            </div>
            <div className="mt-2 text-center">
              <div className="w-16 h-16 bg-slate-200 border border-slate-400 mx-auto flex items-center justify-center text-slate-600 text-xs">
                <QrCode className="w-10 h-10 text-slate-700" />
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Scan to Verify</div>
            </div>
          </div>
        </div>

        {/* Reverse Charge Banner */}
        <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded mb-4 flex items-center justify-between">
          <span><strong>Reverse Charge:</strong> Whether tax is payable on Reverse Charge basis: <strong>NO</strong></span>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">HSN 4901 (Nil-rated 0%)</span>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-200 mb-4">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold">
            <tr>
              <th className="border border-slate-300 p-2 text-center w-8">Sl</th>
              <th className="border border-slate-300 p-2">বইয়ের বিবরণ (Description)</th>
              <th className="border border-slate-300 p-2 text-center w-16">HSN</th>
              <th className="border border-slate-300 p-2 text-center w-10">Qty</th>
              <th className="border border-slate-300 p-2 text-right w-16">MRP</th>
              <th className="border border-slate-300 p-2 text-right w-16">দর (Rate)</th>
              <th className="border border-slate-300 p-2 text-right w-20">করযোগ্য মূল্য</th>
              <th className="border border-slate-300 p-2 text-center w-24">GST কর</th>
              <th className="border border-slate-300 p-2 text-right w-20">মোট (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.item_id || idx} className="border-b border-slate-200">
                <td className="border border-slate-200 p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-slate-200 p-2">
                  <div className="font-bold text-slate-900">{item.book_title}</div>
                  {item.book_title_bn && (
                    <div className="text-xs text-slate-600 font-medium">{item.book_title_bn}</div>
                  )}
                  {item.author_name && (
                    <div className="text-[10px] text-slate-500">লেখক: {item.author_name}</div>
                  )}
                  {item.isbn13 && (
                    <div className="text-[10px] text-slate-400 font-mono">ISBN: {item.isbn13}</div>
                  )}
                </td>
                <td className="border border-slate-200 p-2 text-center font-mono">{item.hsn_code}</td>
                <td className="border border-slate-200 p-2 text-center font-semibold">{item.quantity}</td>
                <td className="border border-slate-200 p-2 text-right font-mono">₹{item.unit_mrp.toFixed(2)}</td>
                <td className="border border-slate-200 p-2 text-right font-mono">₹{item.unit_selling_price.toFixed(2)}</td>
                <td className="border border-slate-200 p-2 text-right font-mono">₹{item.taxable_value.toFixed(2)}</td>
                <td className="border border-slate-200 p-2 text-center text-[10px] text-slate-600">
                  {invoice.is_interstate ? 'IGST 0% (₹0)' : 'CGST 0% + SGST 0%'}
                </td>
                <td className="border border-slate-200 p-2 text-right font-bold font-mono">₹{item.total_item_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary & Settlement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="text-xs">
            <div className="mb-3">
              <span className="text-slate-600 font-semibold">কথায় (Amount in Words):</span>
              <p className="font-serif italic font-bold text-blue-900 mt-0.5">{invoice.amount_in_words}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs mb-3">
              <div className="font-bold text-slate-800 mb-1">পেমেন্ট ও সেটেলমেন্ট তথ্য:</div>
              <div>পেমেন্ট মাধ্যম: <strong className="uppercase font-mono">{invoice.payment_method}</strong> ({invoice.payment_status})</div>
              {invoice.utr_or_rrn && (
                <div>ব্যাংক রেফারেন্স (UTR / RRN): <strong className="font-mono">{invoice.utr_or_rrn}</strong></div>
              )}
            </div>

            {/* Declaration */}
            <div className="border border-dashed border-slate-400 p-2 rounded text-[10px] text-slate-600 leading-relaxed">
              <strong>ঘোষণা (Statutory Declaration):</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Printed books are Nil-rated / exempt from Goods and Services Tax under HSN Code 4901 (Notification No. 2/2017-Central Tax (Rate)).
            </div>
          </div>

          <div className="text-xs">
            <div className="border border-slate-200 rounded p-3 bg-slate-50">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">মোট MRP (Total MRP):</span>
                <span className="font-mono">₹{invoice.subtotal_mrp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                <span>ছাড় (Discount Savings):</span>
                <span className="font-mono">-₹{(invoice.subtotal_mrp - invoice.subtotal_selling_price).toFixed(2)}</span>
              </div>
              {invoice.coupon_discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                  <span>কুপন ডিসকাউন্ট:</span>
                  <span className="font-mono">-₹{invoice.coupon_discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">ডেলিভারি চার্জ:</span>
                <span className="font-mono">{invoice.shipping_fee > 0 ? `₹${invoice.shipping_fee.toFixed(2)}` : 'বিনামূল্যে (FREE)'}</span>
              </div>
              {invoice.cod_handling_fee && invoice.cod_handling_fee > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">COD হ্যান্ডলিং ফি:</span>
                  <span className="font-mono">₹{invoice.cod_handling_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">GST (0% Nil-Rated):</span>
                <span className="font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between py-2 mt-1 text-sm font-black text-slate-900 border-t-2 border-slate-900">
                <span>সর্বমোট দেয় মূল্য:</span>
                <span className="font-mono text-base text-blue-900">₹{invoice.total_payable_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Signature */}
            <div className="mt-4 flex justify-end">
              <div className="text-center w-48">
                <div className="text-xs font-bold text-slate-900">For M.M. BOOK HOUSE</div>
                <div className="mt-8 border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
          This is a computer-generated tax invoice issued by MM Enterprise (M.M. Book House, Malda).
        </div>
      </div>
    </div>
  );
};
