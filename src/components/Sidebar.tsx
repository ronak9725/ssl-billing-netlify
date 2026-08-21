import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CreditCard, 
  Settings, 
  UserCheck, 
  ShieldAlert, 
  Truck, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  PlusCircle, 
  Receipt, 
  AlertTriangle,
  Building,
  Landmark,
  FileCheck2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { CompanySettings } from '../types.js';
import { SslLogo } from './SslLogo.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewInvoice: () => void;
  onNewCustomer: () => void;
  onReceivePayment: () => void;
  onViewOverdue: () => void;
  onOpenAuditLogs: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  companySettings?: CompanySettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewInvoice,
  onNewCustomer,
  onReceivePayment,
  onViewOverdue,
  onOpenAuditLogs,
  isOpenMobile,
  setIsOpenMobile,
  companySettings,
}) => {
  const { user, logout } = useAuth();
  const [invoicesOpen, setInvoicesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const hasModule = (mod: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.modules?.includes(mod);
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B132B] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 px-3.5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B132B]">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none overflow-hidden"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="bg-white/95 rounded-xl p-1 shadow-md shadow-orange-600/10 shrink-0 flex items-center justify-center max-w-[65px] max-h-11 overflow-hidden">
              <SslLogo className="h-9 w-auto max-h-9 max-w-[60px]" customLogoUrl={companySettings?.logo_url} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[13px] tracking-tight text-white leading-tight truncate">
                SHREE SANWARIYA
              </div>
              <div className="text-[10px] font-bold text-orange-400 tracking-wider flex items-center gap-1">
                <span>LOGISTICS</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                <span className="text-[9px] text-emerald-400 uppercase font-semibold">GST APP</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsOpenMobile(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar text-xs">
          {/* Dashboard */}
          {hasModule('dashboard') && (
            <button
              id="sidebar-dashboard-btn"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="text-sm">Dashboard</span>
            </button>
          )}

          {/* Invoices Group */}
          {hasModule('invoices') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  id="sidebar-invoices-btn"
                  onClick={() => handleNavClick('invoices')}
                  className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'invoices'
                      ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Invoices</span>
                </button>
                <button
                  onClick={() => setInvoicesOpen(!invoicesOpen)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  {invoicesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {invoicesOpen && (
                <div className="pl-9 pr-1 space-y-1 text-xs">
                  <button
                    onClick={() => {
                      handleNavClick('invoices');
                      onNewInvoice();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800/40 text-left transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
                    <span>+ New Tax Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      handleNavClick('invoices');
                      onViewOverdue();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 text-left transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Overdue Invoices</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payments */}
          {hasModule('payments') && (
            <div className="flex items-center justify-between">
              <button
                id="sidebar-payments-btn"
                onClick={() => handleNavClick('payments')}
                className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === 'payments'
                    ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="text-sm">Payments</span>
              </button>
              <button
                onClick={onReceivePayment}
                title="Quick Receive Payment"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Customers */}
          {hasModule('customers') && (
            <div className="flex items-center justify-between">
              <button
                id="sidebar-customers-btn"
                onClick={() => handleNavClick('customers')}
                className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === 'customers'
                    ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-sm">Customers</span>
              </button>
              <button
                onClick={onNewCustomer}
                title="Quick Add Customer"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Settings Group */}
          {hasModule('settings') && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <button
                  id="sidebar-settings-btn"
                  onClick={() => handleNavClick('settings')}
                  className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  {settingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {settingsOpen && (
                <div className="pl-9 pr-1 space-y-1 text-xs">
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-left transition"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Company & GST</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 text-left transition"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Bank Details</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Management */}
          {hasModule('users') && user?.role === 'admin' && (
            <button
              id="sidebar-users-btn"
              onClick={() => handleNavClick('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="text-sm">Users & Permissions</span>
            </button>
          )}

          {/* Audit Logs Trigger */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenAuditLogs}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white font-medium transition-all"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-orange-400" />
              <span className="text-sm">Audit & Security Logs</span>
            </button>
          )}
        </div>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0B132B]/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="min-w-0 pr-2">
              <div className="font-semibold text-white text-xs truncate">
                {user?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-orange-400 uppercase font-medium">
                {user?.role} · Online
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
