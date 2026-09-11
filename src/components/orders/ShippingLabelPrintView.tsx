'use client';

/**
 * Module 11 Task 9: 4x6 Inch Courier Shipping Packaging Label Component
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 18, 20, 49):
 * - Standard 4x6 inch (100mm x 150mm) high-contrast courier thermal print layout
 * - Bold "CALL BEFORE DELIVERY" and prominent capitalized Landmark callout (Item 18)
 * - 4-digit Delivery Handover OTP security notice badge (Item 20)
 * - Scanner-ready Code-128 style Barcode graphics for Pincode & Order ID (Item 49)
 * - Gift order indicator with price suppression notice
 * - Fully responsive with print-only media CSS rules
 */

import React, { useRef } from 'react';
import { Printer, X, ShieldCheck, MapPin, Phone, AlertCircle, Gift, Truck } from 'lucide-react';
import type { FormattedShippingLabelData } from '@/lib/services/addressSnapshotService';
import { generateCode128Svg } from '@/lib/services/barcodeGenerator';

export interface ShippingLabelPrintViewProps {
  labelData: FormattedShippingLabelData;
  onClose?: () => void;
  isOpen?: boolean;
  className?: string;
}

/**
 * Scannable Standard Code-128B barcode (Item 49).
 * Reuses the mathematically exact generator already used by the Module 14
 * thermal label so handheld laser scanners can actually read the label.
 */
const ScannableBarcode: React.FC<{
  value: string;
  height?: number;
  barWidth?: number;
  width?: number;
}> = ({ value, height = 40, barWidth = 1.4, width = 180 }) => {
  const svg = React.useMemo(
    () => generateCode128Svg(value, height, barWidth),
    [value, height, barWidth]
  );

  if (!svg) return null;

  return (
    <div
      className="bg-white overflow-hidden mx-auto"
      style={{ width: `${width}px` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const ShippingLabelPrintView: React.FC<ShippingLabelPrintViewProps> = ({
  labelData,
  onClose,
  isOpen = true,
  className = '',
}) => {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto ${className}`}>
      {/* Container Dialog */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-xl overflow-hidden my-auto">
        {/* Top Control Bar (Hidden during thermal printing) */}
        <div className="print:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">
              কুরিয়ার প্যাকেজিং শিপিং লেবেল (4×6 Thermal Print)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 text-xs font-bold rounded shadow-xs active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন (Print)</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4x6 Printable Thermal Label Layout */}
        <div className="p-4 sm:p-6 flex justify-center bg-gray-100 print:bg-white print:p-0">
          <div
            ref={labelRef}
            aria-label="Shipping Packaging Label"
            className="w-[100mm] min-h-[150mm] bg-white border-2 border-black text-black font-sans p-3 flex flex-col justify-between shadow-md print:shadow-none print:border-2 print:border-black print:m-0 print:w-[100mm] print:h-[150mm]"
          >
            {/* Header: Sender Hub & Logistics Info */}
            <div className="border-b-2 border-black pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-sm font-black tracking-tight uppercase leading-none">
                    M.M BOOK HOUSE
                  </h1>
                  <p className="text-[9px] font-bold text-gray-800 uppercase mt-0.5">
                    Rathbari More, English Bazar, Malda - 732101, WB
                  </p>
                  <p className="text-[8px] font-mono text-gray-700">
                    GSTIN: 19AAXFM1234F1Z5 | HELPLINE: +91 9832145678
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block border-2 border-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                    {labelData.zone === 'malda_town' ? 'LOCAL EXPRESS' : 'STANDARD'}
                  </span>
                </div>
              </div>

              {/* Order Barcode */}
              <div className="mt-1.5 pt-1 border-t border-dashed border-black flex justify-center">
                <ScannableBarcode value={labelData.orderId} height={32} width={200} />
              </div>
            </div>

            {/* Recipient SHIP TO Section */}
            <div className="py-2 border-b-2 border-black space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase bg-black text-white px-1 py-0.5">
                  SHIP TO (প্রাপক):
                </span>
                <span className="text-[10px] font-bold font-mono">
                  ORD: {labelData.orderId}
                </span>
              </div>

              <div className="text-xs">
                <h2 className="text-base font-black uppercase tracking-tight text-black">
                  {labelData.recipientName}
                </h2>
                <p className="font-bold text-black flex items-center gap-1 font-mono text-xs">
                  <span>PHONE: {labelData.recipientPhone}</span>
                  {labelData.alternatePhone && <span>/ {labelData.alternatePhone}</span>}
                </p>
              </div>

              <div className="text-[11px] leading-tight font-medium text-black">
                <p className="uppercase">{labelData.streetAddress}</p>
                <p className="font-bold uppercase">
                  {labelData.city}, {labelData.district}, {labelData.state}
                </p>
              </div>

              {/* Item 18: Prominent Landmark Callout */}
              {labelData.landmark && (
                <div className="mt-1.5 p-1.5 bg-gray-100 border border-black text-black">
                  <p className="text-[11px] font-black uppercase tracking-wide">
                    {labelData.prominentLandmark}
                  </p>
                </div>
              )}
            </div>

            {/* Destination Pincode & Routing Barcode */}
            <div className="py-2 border-b-2 border-black flex items-center justify-between gap-2">
              <div className="flex-1">
                <span className="text-[9px] font-black uppercase block">DESTINATION PINCODE:</span>
                <span className="text-3xl font-black font-mono tracking-widest text-black block leading-none mt-0.5">
                  {labelData.pincode}
                </span>
              </div>

              <div className="shrink-0">
                <ScannableBarcode value={labelData.pincodeBarcodeData} height={36} width={150} />
              </div>
            </div>

            {/* Delivery Instructions (Items 13-18) */}
            {labelData.boldInstructions.length > 0 && (
              <div className="py-1.5 border-b-2 border-black">
                <span className="text-[8px] font-black uppercase block text-black">
                  DELIVERY INSTRUCTIONS (রাইডারের নির্দেশিকা):
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {labelData.boldInstructions.map((instruction, idx) => (
                    <span
                      key={idx}
                      className="border border-black px-1.5 py-0.5 text-[9px] font-black uppercase bg-black text-white"
                    >
                      {instruction}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Item 20: Delivery OTP Handover Notice */}
            <div className="py-1.5 border-b border-dashed border-black bg-gray-50 p-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-black shrink-0" />
              <div className="leading-tight">
                <span className="text-[9px] font-black uppercase block text-black">
                  SECURE HANDOVER: 4-DIGIT OTP REQUIRED
                </span>
                <span className="text-[8px] font-medium text-gray-700 block">
                  পার্সেল হস্তান্তরের সময় প্রাপকের ফোন থেকে ৪-ডিজিট ওটিপি সংগ্রহ করুন।
                </span>
              </div>
            </div>

            {/* Item 46: Gift Order Banner if applicable */}
            {labelData.isGift && (
              <div className="py-1 border-b border-dashed border-black text-[9px] font-bold text-black flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-black" />
                <span>GIFT PARCEL - DO NOT DISCLOSE ITEM PRICES ON DOORSTEP</span>
              </div>
            )}

            {/* Footer Signoff */}
            <div className="pt-1.5 flex items-center justify-between text-[8px] font-mono text-gray-800">
              <span>M.M BOOK HOUSE MALDA</span>
              <span>VERIFIED COURIER DISPATCH</span>
              <span>PAGE 1/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelPrintView;
