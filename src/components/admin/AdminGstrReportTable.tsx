'use client';

import React, { useState, useMemo } from 'react';
import { Gstr1ReportRow } from '../../types/invoice';
import { exportGstr1Csv, calculateGstr1Summary } from '../../lib/services/gstrExportService';
import { Download, FileSpreadsheet, CheckCircle, Search, Filter } from 'lucide-react';

interface AdminGstrReportTableProps {
  rows: Gstr1ReportRow[];
  selectedMonth?: string;
}

export const AdminGstrReportTable: React.FC<AdminGstrReportTableProps> = ({
  rows,
  selectedMonth = '2026-09',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => calculateGstr1Summary(rows), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.customer_gstin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'B2B' && row.customer_gstin !== 'URP') ||
        (filterType === 'B2C' && row.customer_gstin === 'URP');

      return matchesSearch && matchesType;
    });
  }, [rows, searchTerm, filterType]);

  const handleDownloadCsv = () => {
    const csvContent = exportGstr1Csv(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GSTR1_Sales_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = () => {
    const csvContent = exportGstr1Csv(filteredRows);
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            GSTR-1 মাসিক বিক্রয় লেজার ও ট্যাক্স রিপোর্ট (Outward Supplies)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            মাসের রিপোর্ট: <strong className="text-slate-800">{selectedMonth}</strong> | মোট ইনভয়েস: <strong className="text-blue-600">{rows.length}</strong> টি
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : null}
            {copied ? 'কপি হয়েছে!' : 'CSV ক্লিপবোর্ডে কপি'}
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            CSV এক্সপোর্ট (CA / Tally)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
          <div className="text-[11px] font-semibold text-slate-500">মোট বিক্রয় (Total Turnover)</div>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">₹{summary.totalInvoiceValue.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">HSN 4901 (Nil-rated 0%)</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
          <div className="text-[11px] font-semibold text-slate-500">করযোগ্য মূল্য (Taxable Value)</div>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">₹{summary.totalTaxableValue.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-1">মোট ইনভয়েস: {summary.totalInvoices}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
          <div className="text-[11px] font-semibold text-slate-500">B2B প্রাতিষ্ঠানিক (GSTIN)</div>
          <div className="text-lg font-black text-blue-700 font-mono mt-0.5">{summary.b2bInvoicesCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">লাইব্রেরি / স্কুল / ডিলার</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
          <div className="text-[11px] font-semibold text-slate-500">B2C খুচরা গ্রাহক (URP)</div>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{summary.b2cInvoicesCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">ব্যক্তিগত ক্রেতা</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ইনভয়েস বা GSTIN খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-end sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            সব ({rows.length})
          </button>
          <button
            onClick={() => setFilterType('B2B')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'B2B' ? 'bg-white font-bold text-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            B2B ({summary.b2bInvoicesCount})
          </button>
          <button
            onClick={() => setFilterType('B2C')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'B2C' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            B2C ({summary.b2cInvoicesCount})
          </button>
        </div>
      </div>

      {/* 10-Column Statutory Table (Item 43) */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="p-2.5">1. ইনভয়েস নং</th>
              <th className="p-2.5">2. তারিখ</th>
              <th className="p-2.5">3. গ্রাহক GSTIN</th>
              <th className="p-2.5 text-center">4. রাজ্য কোড</th>
              <th className="p-2.5 text-center">5. HSN</th>
              <th className="p-2.5 text-right">6. করযোগ্য মূল্য</th>
              <th className="p-2.5 text-right">7. CGST</th>
              <th className="p-2.5 text-right">8. SGST</th>
              <th className="p-2.5 text-right">9. IGST</th>
              <th className="p-2.5 text-right">10. মোট মূল্য (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-slate-500 font-sans">
                  কোনো ইনভয়েস রেকর্ড পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              filteredRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-blue-900">{r.invoice_number}</td>
                  <td className="p-2.5 text-slate-600">{r.invoice_date}</td>
                  <td className="p-2.5">
                    {r.customer_gstin === 'URP' ? (
                      <span className="text-slate-400 font-sans text-[11px]">URP (B2C)</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">{r.customer_gstin}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center text-slate-700">{r.customer_state_code}</td>
                  <td className="p-2.5 text-center font-bold">{r.hsn_code}</td>
                  <td className="p-2.5 text-right">₹{r.taxable_value.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-400">₹{r.cgst_amount.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-400">₹{r.sgst_amount.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-400">₹{r.igst_amount.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₹{r.total_amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
