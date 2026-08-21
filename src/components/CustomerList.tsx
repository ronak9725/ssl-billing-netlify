import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  ArrowUpRight, 
  Trash2,
  Edit2,
  AlertCircle,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { Customer, CompanySettings } from '../types.js';
import { formatINR } from '../utils/pdfGenerator.js';

interface CustomerListProps {
  onNewCustomer: () => void;
  onSelectCustomer: (cust: Customer) => void;
  companySettings: CompanySettings;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onNewCustomer,
  onSelectCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'outstanding' | 'overdue'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/customers?page=${page}&page_size=50`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await apiRequest<{ items: Customer[]; total: number }>(url);
      setCustomers(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  // Filter customers by outstanding / overdue
  const displayedCustomers = customers.filter(c => {
    const outstanding = (c.outstanding ?? c.balance) || 0;
    const overdue = c.overdue_amount || 0;
    if (filterType === 'outstanding') return outstanding > 0.01;
    if (filterType === 'overdue') return overdue > 0.01;
    return true;
  });

  const totalOutstandingAcross = customers.reduce((sum, c) => sum + ((c.outstanding ?? c.balance) || 0), 0);
  const totalOverdueAcross = customers.reduce((sum, c) => sum + (c.overdue_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Customer Master & Outstanding Registry</span>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {total} Consignees
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer balances, credit terms, monthly billings, and generate outstanding statements
          </p>
        </div>

        <button
          id="new-customer-btn"
          onClick={onNewCustomer}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Customers</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{total}</div>
        </div>

        <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] text-orange-700 font-semibold uppercase block">Total Outstanding Balance</span>
          <div className="text-xl font-extrabold text-orange-600 font-mono mt-1">₹{formatINR(totalOutstandingAcross)}</div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] text-rose-700 font-semibold uppercase block">Total Overdue Dues</span>
          <div className="text-xl font-extrabold text-rose-600 font-mono mt-1">₹{formatINR(totalOverdueAcross)}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, GSTIN, city, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('outstanding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'outstanding' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            With Outstanding ({customers.filter(c => ((c.outstanding ?? c.balance) || 0) > 0.01).length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'overdue' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            Overdue Dues ({customers.filter(c => (c.overdue_amount || 0) > 0.01).length})
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : displayedCustomers.length > 0 ? (
          displayedCustomers.map((cust) => {
            const outstanding = (cust.outstanding ?? cust.balance) || 0;
            const overdue = cust.overdue_amount || 0;

            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-5 cursor-pointer transition shadow-xs flex flex-col justify-between hover:shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition">{cust.name}</h3>
                        <p className="text-[11px] text-slate-500">{cust.contact_person || 'Consignee'}</p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                      {cust.payment_terms || 'Net 15'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{cust.city ? `${cust.city}, ${cust.state || ''}` : 'Location not set'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-slate-400">GSTIN:</span>
                      <span className="text-slate-800 font-semibold">{cust.gstin || 'Unregistered'}</span>
                    </div>

                    {cust.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Balance Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Outstanding Balance</span>
                    <div className={`font-mono font-bold text-sm ${outstanding > 0.01 ? 'text-orange-600' : 'text-slate-800'}`}>
                      ₹{formatINR(outstanding)}
                    </div>
                    {overdue > 0.01 && (
                      <span className="text-[10px] text-rose-600 font-semibold">
                        Overdue: ₹{formatINR(overdue)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold group-hover:translate-x-0.5 transition">
                    <span>Monthly Statement</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">
            No customers found matching the filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

