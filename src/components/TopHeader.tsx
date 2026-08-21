import React from 'react';
import { 
  Menu, 
  PlusCircle, 
  Receipt, 
  Users, 
  ShieldAlert, 
  Calendar,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { CompanySettings } from '../types.js';
import { SslLogo } from './SslLogo.js';

interface TopHeaderProps {
  activeTab: string;
  onToggleSidebar: () => void;
  onNewInvoice: () => void;
  onReceivePayment: () => void;
  onNewCustomer: () => void;
  onOpenAuditLogs: () => void;
  companySettings?: CompanySettings;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onToggleSidebar,
  onNewInvoice,
  onReceivePayment,
  onNewCustomer,
  onOpenAuditLogs,
  companySettings,
}) => {
  const { user } = useAuth();

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'invoices': return 'Tax Invoices & Billing';
      case 'customers': return 'Customer Directory';
      case 'payments': return 'Payment Receipts';
      case 'settings': return 'Company & GST Configuration';
      case 'users': return 'Staff Administration';
      default: return activeTab;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs max-w-[130px] max-h-9 overflow-hidden shrink-0">
            <SslLogo className="h-7 w-auto max-h-7 max-w-[120px]" customLogoUrl={companySettings?.logo_url} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
                SHREE SANWARIYA LOGISTICS
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 hidden sm:inline-block">
                FY 2026-27 Active
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 capitalize hidden sm:block">
              {getTabLabel()}
            </h2>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="top-new-invoice-btn"
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Tax Invoice</span>
          <span className="sm:hidden">Invoice</span>
        </button>

        <button
          id="top-record-payment-btn"
          onClick={onReceivePayment}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 rounded-lg text-xs font-medium transition"
        >
          <Receipt className="w-3.5 h-3.5 text-slate-600" />
          <span>Receive Payment</span>
        </button>

        <button
          id="top-add-customer-btn"
          onClick={onNewCustomer}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 rounded-lg text-xs font-medium transition"
        >
          <Users className="w-3.5 h-3.5 text-slate-600" />
          <span>Add Customer</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={onOpenAuditLogs}
            title="System Audit & Compliance Log"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <ShieldAlert className="w-4 h-4 text-orange-600" />
          </button>
        )}

        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center border border-orange-200">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
