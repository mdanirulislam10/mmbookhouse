'use client';

import React from 'react';
import { ThermalShippingLabelData } from '../../types/invoice';
import { Printer, ArrowLeft } from 'lucide-react';
import { generateCode128Svg } from '../../lib/services/barcodeGenerator';
import { generateSvgQrCode } from '../../lib/services/qrCodeGenerator';

interface ThermalShippingLabelProps {
  labelData: ThermalShippingLabelData;
  onBack?: () => void;
}

export const ThermalShippingLabel: React.FC<ThermalShippingLabelProps> = ({ labelData, onBack }) => {
  const barcodeSvg = generateCode128Svg(labelData.awb_tracking_number, 50, 1.8);
  const qrSvg = generateSvgQrCode(`https://mmbookhouse.com/track/${labelData.awb_tracking_number}`, 70);
  const isCod = labelData.payment_mode === 'COD';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-4 flex flex-col items-center">
      {/* Action Bar */}
      <div className="w-[100mm] max-w-full mb-4 flex items-center justify-between print:hidden bg-white p-3 rounded-lg shadow border border-slate-300">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-black hover:bg-slate-800 px-3.5 py-1.5 rounded shadow"
        >
          <Printer className="w-3.5 h-3.5" />
          Print 4x6" Label
        </button>
      </div>

      {/* Injected Print Stylesheet for 4x6 Thermal Printers (100mm x 150mm) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: 100mm 150mm;
              margin: 0;
            }
            @media print {
              html, body {
                width: 100mm !important;
                height: 150mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              .thermal-print-area {
                width: 100mm !important;
                height: 150mm !important;
                margin: 0 !important;
                padding: 3mm !important;
                box-shadow: none !important;
                border: 2px solid #000000 !important;
              }
            }
          `,
        }}
      />

      {/* 4x6 Thermal Label Container (100mm x 150mm) with Mobile Scale Wrapper */}
      <div className="w-full flex justify-center overflow-x-auto pb-4">
        <div className="thermal-print-area w-[100mm] min-w-[100mm] h-[150mm] bg-white border-2 border-black p-3.5 flex flex-col justify-between shadow-2xl print:shadow-none print:border-2 print:border-black print:m-0">
        {/* Header Row */}
        <div className="flex justify-between items-center border-b-2 border-black pb-1.5">
          <div>
            <div className="text-base font-black tracking-wide uppercase">{labelData.courier_name}</div>
            <div className="text-[9px] font-bold text-slate-700">SURFACE / AIR DISPATCH</div>
          </div>
          <div className="bg-black text-white px-2 py-0.5 text-xs font-black tracking-wider">
            MALDA / CCU
          </div>
        </div>

        {/* Barcode Section */}
        <div className="text-center py-1 border-b border-black">
          <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
          <div className="flex justify-between text-[9px] font-mono mt-0.5">
            <span>ORD: <strong>{labelData.order_id}</strong></span>
            <span>INV: <strong>{labelData.invoice_number}</strong></span>
          </div>
        </div>

        {/* Payment & OTP */}
        <div className="flex justify-between items-center border-b border-black py-1">
          <div className={`border-2 border-black px-2.5 py-0.5 text-sm font-black uppercase ${isCod ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {isCod ? `COD: ₹${(labelData.collectable_amount || 0).toFixed(0)}` : 'PREPAID'}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black">WT: {labelData.weight_kg.toFixed(2)} KG</div>
            {labelData.otp_badge && (
              <div className="text-[9px] font-black border border-black px-1 mt-0.5">
                {labelData.otp_badge}
              </div>
            )}
          </div>
        </div>

        {/* Recipient Address */}
        <div className="border-b border-black py-1.5 flex-grow">
          <div className="text-[9px] font-black uppercase text-slate-600">DELIVER TO:</div>
          <div className="text-sm font-black text-black leading-tight mt-0.5">{labelData.recipient_name}</div>
          <div className="text-[11px] leading-tight mt-0.5 text-black">{labelData.recipient_address}</div>
          
          {labelData.recipient_landmark && (
            <div className="border border-dashed border-black px-1.5 py-0.5 mt-1 text-[10px] font-bold">
              LANDMARK: {labelData.recipient_landmark}
            </div>
          )}

          <div className="text-[11px] mt-0.5">
            {labelData.recipient_city}, {labelData.recipient_district}, {labelData.recipient_state}
          </div>

          <div className="text-lg font-black tracking-widest mt-1">
            PIN: {labelData.recipient_pincode}
          </div>

          <div className="text-xs font-bold mt-0.5">
            TEL: {labelData.recipient_phone}
          </div>
        </div>

        {/* Footer: RTO Box & QR */}
        <div className="flex justify-between items-end pt-1">
          <div className="text-[8px] leading-tight max-w-[65mm]">
            <strong className="text-[8.5px]">RETURN IF UNDELIVERED (RTO):</strong><br/>
            {labelData.seller_return_address}
          </div>
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>
      </div>
    </div>
  </div>
);
};
