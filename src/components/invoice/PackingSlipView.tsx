'use client';

import React, { useState } from 'react';
import { PackingSlipData } from '../../types/invoice';
import { Printer, CheckSquare, Square, ArrowLeft } from 'lucide-react';

interface PackingSlipViewProps {
  slipData: PackingSlipData;
  onBack?: () => void;
}

export const PackingSlipView: React.FC<PackingSlipViewProps> = ({ slipData, onBack }) => {
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Action Bar */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ফিরে যান (Back)
            </button>
          )}
          <span className="text-xs font-bold text-slate-800">প্যাকিং স্লিপ / পিকলিস্ট</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded shadow"
        >
          <Printer className="w-3.5 h-3.5" />
          Print A5 Slip
        </button>
      </div>

      {/* A5 Slip Container */}
      <div className="max-w-2xl mx-auto bg-white border border-slate-300 p-6 shadow rounded print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div>
            <h1 className="text-lg font-black text-slate-900">M.M. BOOK HOUSE - WAREHOUSE PICK LIST</h1>
            <p className="text-xs text-slate-600">
              অর্ডার আইডি: <strong className="font-mono">{slipData.order_id}</strong> | ইনভয়েস: <strong className="font-mono">{slipData.invoice_number}</strong>
            </p>
          </div>
          <div className="border-2 border-slate-900 px-2.5 py-1 text-xs font-black uppercase">
            {slipData.delivery_speed || 'STANDARD'}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs mb-4">
          <div>গ্রাহকের নাম: <strong className="text-slate-900">{slipData.customer_name}</strong></div>
          {slipData.packer_note && (
            <div className="text-red-700 font-bold mt-1">প্যাকার নোট: {slipData.packer_note}</div>
          )}
        </div>

        <table className="w-full text-left text-xs border-collapse border border-slate-200 mb-6">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold">
            <tr>
              <th className="border border-slate-300 p-2 text-center w-12">পিক</th>
              <th className="border border-slate-300 p-2 text-center w-8">Sl</th>
              <th className="border border-slate-300 p-2">বইয়ের বিবরণ (Book Details)</th>
              <th className="border border-slate-300 p-2 text-center w-12">সংখ্যা</th>
              <th className="border border-slate-300 p-2 text-center w-20">র‍্যাক / বিন</th>
            </tr>
          </thead>
          <tbody>
            {slipData.items.map((it, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="border border-slate-200 p-2 text-center cursor-pointer" onClick={() => toggleCheck(idx)}>
                  {checkedItems[idx] ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 mx-auto" />
                  )}
                </td>
                <td className="border border-slate-200 p-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-slate-200 p-2">
                  <div className="font-bold text-slate-900">{it.title}</div>
                  {it.title_bn && <div className="text-slate-600">{it.title_bn}</div>}
                  {it.author && <div className="text-[10px] text-slate-500">লেখক: {it.author}</div>}
                  {it.isbn13 && <div className="text-[9px] font-mono text-slate-400">ISBN: {it.isbn13}</div>}
                </td>
                <td className="border border-slate-200 p-2 text-center font-bold text-base">{it.quantity}</td>
                <td className="border border-slate-200 p-2 text-center font-mono text-[11px] bg-slate-50">RACK-B2</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-slate-400 pt-3 flex justify-between text-xs text-slate-600">
          <div>Picker Initial: __________________</div>
          <div>Packer QC: __________________</div>
          <div>Dispatch: [ &nbsp; ] OK</div>
        </div>
      </div>
    </div>
  );
};
