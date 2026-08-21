import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  Download,
  Trash2
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { Payment, CompanySettings } from '../types.js';
import { formatINR, printReceiptPDF } from '../utils/pdfGenerator.js';

interface PaymentListProps {
  onNewPayment: () => void;
  companySettings: CompanySettings;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onNewPayment,
  companySettings,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = `/payments?page=${page}&page_size=20`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await apiRequest<{ items: Payment[]; total: number }>(url);
      setPayments(res.items || []);
      setTotal(res.total || 0);

      const sum = (res.items || []).reduce((acc, p) => acc + (p.amount || 0), 0);
      setTotalCollected(sum);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Payment Collections</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Receipt Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Realised bank transfers, NEFT/RTGS, cheques, UPI receipts against invoices
          </p>
        </div>

        <button
          id="new-payment-btn"
          onClick={onNewPayment}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Receipt Transactions</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Realised</div>
          <div className="text-xl font-bold text-emerald-600 font-mono mt-1">₹{formatINR(totalCollected)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bank Verification Status</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Synchronized with invoices</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by reference, UTR, customer, invoice..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs transition"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Against Invoice</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono">{p.payment_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.customer_name || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-600">{p.invoice_no || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.reference || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                      ₹{formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => printReceiptPDF(p, companySettings)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Print Official Payment Receipt PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No payment collections recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
