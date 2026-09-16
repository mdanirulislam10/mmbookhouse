'use client';

import React, { useState } from 'react';
import { TaxInvoice } from '../../types/invoice';
import { Printer, Download, ArrowLeft, ShieldCheck, Share2, MessageCircle, Check, Copy, ExternalLink } from 'lucide-react';
import { generateSvgQrCode } from '../../lib/services/qrCodeGenerator';

interface AmazonTaxInvoiceViewProps {
  invoice: TaxInvoice;
  onBack?: () => void;
}

export const AmazonTaxInvoiceView: React.FC<AmazonTaxInvoiceViewProps> = ({ invoice, onBack }) => {
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ORIGINAL');
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invoice.verification_qr_url || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // 1-Tap WhatsApp Share Pre-formatted Payload (Item 36, 39)
  const waShareText = encodeURIComponent(
    `📚 *M.M. BOOK HOUSE (মালদা)* - অফিশিয়াল ট্যাক্স ইনভয়েস\n` +
    `------------------------------------------\n` +
    `ক্রেতার নাম: *${invoice.customer.customer_name}*\n` +
    `ইনভয়েস নং: *${invoice.invoice_number}*\n` +
    `অর্ডার আইডি: *#${invoice.order_id}*\n` +
    `মোট প্রদেয়: *₹${invoice.total_payable_amount.toFixed(2)}* (${invoice.payment_status === 'PAID' ? 'পরিশোধিত' : 'ক্যাশ অন ডেলিভারি'})\n` +
    `জিএসটি হার: HSN 4901 (0% Nil-Rated GST)\n\n` +
    `📥 ডিজিটাল চালান ভেরিফাই ও ডাউনলোড করতে ক্লিক করুন:\n` +
    `${invoice.verification_qr_url || 'https://mmbookhouse.com'}`
  );
  const waShareUrl = `https://wa.me/?text=${waShareText}`;

  // Generate real, standard-compliant vector QR code (Item 17)
  const qrSvg = generateSvgQrCode(invoice.verification_qr_url || `https://mmbookhouse.com/verify-invoice/${invoice.invoice_number}`, 78);

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 px-2 sm:px-6 font-sans">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 print:hidden bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                ফিরে যান (Back)
              </button>
            )}
            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              ইনভয়েস: <span className="font-mono text-blue-600 font-bold">{invoice.invoice_number}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Selector */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-medium">
              <button
                onClick={() => setCopyType('ORIGINAL')}
                className={`px-2 py-1 rounded transition ${copyType === 'ORIGINAL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
              >
                Original
              </button>
              <button
                onClick={() => setCopyType('DUPLICATE')}
                className={`px-2 py-1 rounded transition ${copyType === 'DUPLICATE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
              >
                Duplicate
              </button>
              <button
                onClick={() => setCopyType('TRIPLICATE')}
                className={`px-2 py-1 rounded transition ${copyType === 'TRIPLICATE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
              >
                Triplicate
              </button>
            </div>

            {/* 1-Tap WhatsApp Share (Item 39) */}
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#128c7e] bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/30 rounded-lg transition"
              title="হোয়াটসঅ্যাপে ইনভয়েস শেয়ার করুন"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25d366]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="ইনভয়েস লিঙ্ক কপি করুন"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'কপি হয়েছে' : 'লিঙ্ক কপি'}</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-4 sm:p-8 shadow-md rounded-xl print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-3 sm:pb-4 mb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{invoice.seller.trade_name}</h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {invoice.seller.legal_name} | Netaji Subhash Road, English Bazar, Malda, WB - 732101
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              GSTIN: <strong className="font-mono">{invoice.seller.gstin}</strong> | PAN: <strong className="font-mono">{invoice.seller.pan}</strong> | State: 19-West Bengal
            </p>
          </div>
          <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 border border-slate-400 rounded text-slate-800">
              {copyLabel}
            </span>
            <div>
              <div className="text-lg font-black text-slate-900 mt-1">TAX INVOICE</div>
              <div className="text-[10px] text-slate-500">(Under Rule 46 of CGST Rules, 2017)</div>
            </div>
          </div>
        </div>

        {/* 3-Column Meta Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          {/* Supplier */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <div className="font-bold text-slate-600 uppercase text-[10px] border-b border-slate-200 pb-1 mb-1.5">
              Sold By (Supplier)
            </div>
            <div className="font-bold text-slate-900">{invoice.seller.trade_name}</div>
            <div>{invoice.seller.address_line1}</div>
            <div>{invoice.seller.city}, {invoice.seller.district} - {invoice.seller.pincode}</div>
            <div>State: {invoice.seller.state} (Code: {invoice.seller.state_code})</div>
            <div className="mt-1 text-slate-500">Phone: {invoice.seller.phone}</div>
          </div>

          {/* Customer */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <div className="font-bold text-slate-600 uppercase text-[10px] border-b border-slate-200 pb-1 mb-1.5">
              Billing & Shipping Address
            </div>
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

          {/* Invoice & Order details + Verification QR */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 flex flex-col justify-between items-center text-center">
            <div>
              <div className="font-bold text-slate-600 uppercase text-[10px] border-b border-slate-200 pb-1 mb-1.5 w-full">
                Invoice Verification
              </div>
              <div>ইনভয়েস নং: <strong className="font-mono text-blue-900">{invoice.invoice_number}</strong></div>
              <div className="mt-0.5">তারিখ: <strong>{invoice.invoice_date}</strong></div>
              <div className="mt-0.5">অর্ডার আইডি: <strong className="font-mono">{invoice.order_id}</strong></div>
            </div>

            {/* Real Camera-Scannable QR Code (Item 17) */}
            <div className="mt-2 text-center flex flex-col items-center">
              <div 
                className="w-20 h-20 bg-white border border-slate-300 p-1 rounded shadow-2xs flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="text-[9px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Scan to Verify Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reverse Charge Banner & Payment Stamp (Item 49) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <span><strong>Reverse Charge Mechanism:</strong> Whether tax is payable on Reverse Charge basis: <strong>NO</strong></span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">HSN 4901 (Nil-rated 0%)</span>
          </div>

          {/* Official Payment Status Stamp (Item 49) */}
          <div className="self-end sm:self-auto">
            {invoice.payment_status === 'PAID' ? (
              <div className="border-2 border-emerald-600 bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border-dashed shadow-xs">
                ✔ PAID (Online)
              </div>
            ) : (
              <div className="border-2 border-amber-600 bg-amber-100/80 text-amber-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border-dashed shadow-xs">
                ⚠ COLLECT CASH ON DELIVERY
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table (Mobile Responsive with Horizontal Scroll) */}
        <div className="overflow-x-auto -mx-1 sm:mx-0 mb-4 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 sm:hidden border-b border-slate-200 flex justify-between font-medium">
            <span>বইয়ের তালিকা ও কর বিবরণী</span>
            <span>⟷ ডানে স্ক্রোল করুন</span>
          </div>
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold">
              <tr>
                <th className="border-b border-slate-300 p-2 text-center w-8">Sl</th>
                <th className="border-b border-slate-300 p-2">বইয়ের বিবরণ (Description)</th>
                <th className="border-b border-slate-300 p-2 text-center w-16">HSN</th>
                <th className="border-b border-slate-300 p-2 text-center w-10">Qty</th>
                <th className="border-b border-slate-300 p-2 text-right w-16">MRP</th>
                <th className="border-b border-slate-300 p-2 text-right w-16">দর (Rate)</th>
                <th className="border-b border-slate-300 p-2 text-right w-20">করযোগ্য মূল্য</th>
                <th className="border-b border-slate-300 p-2 text-center w-24">GST কর</th>
                <th className="border-b border-slate-300 p-2 text-right w-20">মোট (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={item.item_id || idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2">
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
                  <td className="p-2 text-center font-mono">{item.hsn_code}</td>
                  <td className="p-2 text-center font-semibold">{item.quantity}</td>
                  <td className="p-2 text-right font-mono text-slate-500">₹{item.unit_mrp.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">₹{item.unit_selling_price.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">₹{item.taxable_value.toFixed(2)}</td>
                  <td className="p-2 text-center text-[10px] text-slate-600">
                    {invoice.is_interstate ? 'IGST 0% (₹0)' : 'CGST 0% + SGST 0%'}
                  </td>
                  <td className="p-2 text-right font-bold font-mono">₹{item.total_item_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Settlement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="text-xs">
            <div className="mb-3">
              <span className="text-slate-600 font-semibold">কথায় (Amount in Words):</span>
              <p className="font-serif italic font-bold text-blue-900 mt-0.5">{invoice.amount_in_words}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs mb-3">
              <div className="font-bold text-slate-800 mb-1">পেমেন্ট ও সেটেলমেন্ট তথ্য:</div>
              <div>পেমেন্ট মাধ্যম: <strong className="uppercase font-mono">{invoice.payment_method}</strong> ({invoice.payment_status})</div>
              {invoice.utr_or_rrn && (
                <div>ব্যাংক রেফারেন্স (UTR / RRN): <strong className="font-mono">{invoice.utr_or_rrn}</strong></div>
              )}
            </div>

            {/* Declaration (Item 8) */}
            <div className="border border-dashed border-slate-300 p-2.5 rounded-lg text-[10px] text-slate-600 leading-relaxed bg-slate-50/50">
              <strong>ঘোষণা (Statutory Declaration):</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Printed books are Nil-rated / exempt from Goods and Services Tax under HSN Code 4901 (Notification No. 2/2017-Central Tax (Rate)).
            </div>
          </div>

          <div className="text-xs">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
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

            {/* Signature Stamp (Item 8) */}
            <div className="mt-4 flex justify-end">
              <div className="text-center w-52 border border-slate-200 rounded p-2 bg-slate-50/50">
                <div className="text-[11px] font-bold text-slate-900">For M.M. BOOK HOUSE - Malda</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Authorised Digital Signatory</div>
                <div className="mt-3 border-t border-slate-300 pt-1 text-[9px] text-slate-500 italic">
                  Computer generated — requires no physical signature
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eco Green E-Commerce Footer (Item 40) */}
        <div className="border-t border-slate-200 pt-3 text-center space-y-1">
          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 py-1 px-2 rounded-full inline-block">
            🌱 Save Paper, Save Trees — Go Digital with M.M Book House Malda
          </div>
          <div className="text-[9px] text-slate-400">
            Registered Office: Netaji Subhash Road, English Bazar, Malda, West Bengal - 732101 | Helpline: +91 97330 00000 | mmbookhouse.com
          </div>
        </div>
      </div>
    </div>
  );
};

