import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  FileText, 
  ArrowUpRight, 
  PlusCircle, 
  Receipt,
  Calendar,
  CheckCircle2,
  DollarSign,
  Percent,
  Filter,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { apiRequest } from '../services/api.js';
import { Invoice, CompanySettings } from '../types.js';

interface DashboardProps {
  onNewInvoice: () => void;
  onNewCustomer: () => void;
  onReceivePayment: () => void;
  onViewOverdue: () => void;
  onSelectInvoice: (inv: Invoice) => void;
  companySettings?: CompanySettings;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNewInvoice,
  onNewCustomer,
  onReceivePayment,
  onViewOverdue,
  onSelectInvoice,
  companySettings,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters matching the reference layout
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = async (fDate = fromDate, tDate = toDate) => {
    setLoading(true);
    try {
      let url = '/dashboard/summary';
      const params = new URLSearchParams();
      if (fDate) params.append('from', fDate);
      if (tDate) params.append('to', tDate);
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await apiRequest<any>(url);
      setMetrics(res);
      setRecentInvoices(res.recent_invoices || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilter = () => {
    loadData(fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    loadData('', '');
  };

  const formatINR = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatK = (val: number | undefined) => {
    if (!val) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const chartData = (metrics?.chart_data || []).map((d: any) => ({
    month: d.month,
    Invoiced: d.sales || 0,
    Collected: d.collected || 0,
  }));

  const profit = (metrics?.taxable_sales || 0) * 0.85; // Simulated margin for freight

  return (
    <div className="space-y-6">
      {/* Dashboard Top Title & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold hidden sm:inline-block">
              {companySettings?.invoice_prefix || 'SSL'} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Live freight billing, payments, GST summaries and customer metrics.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-medium focus:ring-0 p-0"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-medium focus:ring-0 p-0"
            />
          </div>

          <button
            onClick={handleApplyFilter}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
          >
            Apply
          </button>

          {(fromDate || toDate) && (
            <button
              onClick={handleClearFilter}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 4 Stats Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Sales
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
              ₹{formatINR(metrics?.total_sales)}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics?.invoices || 0} invoices</span>
            <span className="text-slate-400 text-[11px]">Gross Billed</span>
          </div>
        </div>

        {/* Taxable Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Taxable Sales
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
              ₹{formatINR(metrics?.taxable_sales)}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Freight + Surcharge</span>
            <span className="text-slate-400 text-[11px]">Base Value</span>
          </div>
        </div>

        {/* GST */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              GST (18% Pool)
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
              ₹{formatINR(metrics?.gst)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>CGST {formatK(metrics?.cgst)}</span>
            <span>SGST {formatK(metrics?.sgst)}</span>
            <span>IGST {formatK(metrics?.igst || 0)}</span>
          </div>
        </div>

        {/* Payments Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Payments Received
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono tracking-tight">
              ₹{formatINR(metrics?.payments_received)}
            </div>
          </div>
          <div className="text-xs text-emerald-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between font-medium">
            <span>{metrics?.paid || 0} fully settled</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px]">Realised</span>
          </div>
        </div>
      </div>

      {/* Secondary 4 Stats Cards (Row 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Outstanding
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-2 font-mono tracking-tight">
              ₹{formatINR(metrics?.outstanding)}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics?.pending || 0} pending invoices</span>
            {metrics?.overdue > 0 && (
              <span className="text-rose-600 font-semibold text-[11px]">{metrics?.overdue} overdue</span>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Expenses
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2 font-mono tracking-tight">
              ₹0.00
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Fleet & Tolls</span>
            <span className="text-slate-400 text-[11px]">Direct Log</span>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Estimated Profit
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-2 font-mono tracking-tight">
              ₹{formatINR(profit)}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Margin ~85%</span>
            <span className="text-emerald-600 font-medium text-[11px]">Net Freight</span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Customers
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
              {metrics?.customers || 0}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Active Master Registry</span>
            <span className="text-slate-400 text-[11px]">Consignees</span>
          </div>
        </div>
      </div>

      {/* Mini Counters Grid (Row 3 matching screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-none">{metrics?.invoices || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Total Invoices</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-none">{metrics?.paid || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Paid</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-none">{metrics?.pending || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Pending</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-rose-600 leading-none">{metrics?.overdue || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Overdue</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-none">{metrics?.customers || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Customers</div>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Sales & Payments
              </h2>
              <p className="text-xs text-slate-500">Billed freight invoices vs. realised collections</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-600 inline-block"></span>
                <span className="text-slate-600">Invoiced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span className="text-slate-600">Collected</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`₹${formatINR(Number(value))}`, '']}
                  contentStyle={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '8px', color: '#FFF' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Bar dataKey="Invoiced" fill="#EA580C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GST & Settlement Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tax & Settlement Health
            </h2>
            <p className="text-xs text-slate-500 mb-4">GST Tax Breakdown & Payment Collection Ratio</p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Payment Recovery Ratio</span>
                  <span className="font-bold text-slate-900">
                    {metrics?.total_sales ? ((metrics.payments_received / metrics.total_sales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, metrics?.total_sales ? (metrics.payments_received / metrics.total_sales) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST 9%)</span>
                  <span className="font-mono font-semibold text-slate-900">₹{formatINR(metrics?.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST 9%)</span>
                  <span className="font-mono font-semibold text-slate-900">₹{formatINR(metrics?.sgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST 18%)</span>
                  <span className="font-mono font-semibold text-slate-900">₹{formatINR(metrics?.igst || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Tax Liability</span>
                  <span className="font-mono text-orange-600">₹{formatINR(metrics?.gst)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex gap-2">
            <button
              onClick={onNewInvoice}
              className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold text-xs transition text-center shadow-xs"
            >
              + Create Invoice
            </button>
            <button
              onClick={onReceivePayment}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition text-center"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Logistics Invoices</h2>
            <p className="text-xs text-slate-500">Latest dispatched consignment bills</p>
          </div>
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
            SAC 996511
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-orange-600">
                      {inv.invoice_no}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.buyer_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.from_city} &rarr; {inv.to_city}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      ₹{formatINR(inv.totals?.taxable_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{formatINR(inv.totals?.grand_total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : inv.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No recent invoices recorded.
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
