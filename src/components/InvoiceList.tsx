import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Printer, 
  CreditCard, 
  AlertCircle, 
  Trash2, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Edit3,
  X
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { Invoice, CompanySettings, BankAccount } from '../types.js';
import { formatINR, printInvoicePDF } from '../utils/pdfGenerator.js';
import { DeleteInvoiceModal } from './DeleteInvoiceModal.js';

interface InvoiceListProps {
  onNewInvoice: () => void;
  onSelectInvoice: (inv: Invoice) => void;
  onEditInvoice?: (inv: Invoice) => void;
  onRecordPayment: (inv: Invoice) => void;
  companySettings: CompanySettings;
  defaultBank?: BankAccount;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onNewInvoice,
  onSelectInvoice,
  onEditInvoice,
  onRecordPayment,
  companySettings,
  defaultBank,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    count: 0,
    grand_total: 0,
    taxable: 0,
    gst: 0,
    balance: 0,
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/invoices?page=${page}&page_size=20&sort=invoice_date&order=desc`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await apiRequest<{
        items: Invoice[];
        total: number;
        summary: any;
      }>(url);

      setInvoices(res.items || []);
      setTotal(res.total || 0);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search, page]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleExportCSV = async () => {
    try {
      const csv = await apiRequest<string>('/invoices/export');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tax Invoices</span>
            <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-200">
              SAC 996511
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Freight charges, surcharges, GST breakdown, and client settlement status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="export-invoices-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="new-invoice-btn"
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtered Invoices</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{summary.count}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taxable Value</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">₹{formatINR(summary.taxable)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GST Liability</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">₹{formatINR(summary.gst)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
          <div className="text-xl font-bold text-orange-600 font-mono mt-1">₹{formatINR(summary.balance)}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 w-full md:w-auto shadow-xs">
          {[
            { key: 'all', label: 'All Invoices' },
            { key: 'pending', label: 'Pending & Partial' },
            { key: 'paid', label: 'Fully Paid' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'draft', label: 'Draft' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.key
                  ? 'bg-orange-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, LR, buyer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs transition"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Buyer Details</th>
                <th className="py-3 px-4">LR & Route</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      <span>{inv.invoice_no}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.buyer?.name || '—'}</div>
                      <div className="text-[11px] text-slate-400">{inv.buyer?.city || inv.place_of_supply || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">{inv.lr_no || '—'}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.origin && inv.destination ? `${inv.origin} → ${inv.destination}` : 'Local Freight'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{formatINR(inv.totals?.grand_total || inv.grand_total)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-orange-600">
                      ₹{formatINR(inv.balance ?? inv.grand_total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          inv.display_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.display_status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : inv.display_status === 'partially_paid'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inv.display_status === 'cancelled'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {inv.display_status || 'issued'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => printInvoicePDF(inv, companySettings, defaultBank)}
                          title="Print A4 Tax Invoice PDF"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {inv.display_status !== 'cancelled' && onEditInvoice && (
                          <button
                            onClick={() => onEditInvoice(inv)}
                            title="Edit Invoice"
                            className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {inv.display_status !== 'paid' && inv.display_status !== 'cancelled' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          title="Cancel or Delete Invoice"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No invoices matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete / Cancel Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <DeleteInvoiceModal
          invoice={invoiceToDelete}
          onClose={() => setInvoiceToDelete(null)}
          onSuccess={(msg) => {
            setInvoiceToDelete(null);
            setToastMessage(msg || 'Invoice updated successfully');
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
};
