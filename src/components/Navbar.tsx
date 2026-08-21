import React from 'react';
import { 
  FileText, 
  Users, 
  CreditCard, 
  Settings, 
  UserCheck, 
  LogOut, 
  Truck,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuditLogs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuditLogs }) => {
  const { user, logout, hasModule } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base tracking-wide text-white flex items-center gap-2">
                <span className="truncate">SANWARIYA LOGISTICS</span>
                <span className="hidden xl:inline-block text-[10px] bg-orange-500/10 text-orange-400 font-semibold px-2 py-0.5 rounded border border-orange-500/20 whitespace-nowrap">
                  SAC 996511
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono hidden sm:block truncate">
                GST Transport & Freight Billing
              </div>
            </div>
          </div>

          {/* Module Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            {hasModule('dashboard') && (
              <button
                id="nav-dashboard-btn"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Dashboard</span>
              </button>
            )}

            {hasModule('invoices') && (
              <button
                id="nav-invoices-btn"
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'invoices'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Invoices</span>
              </button>
            )}

            {hasModule('customers') && (
              <button
                id="nav-customers-btn"
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'customers'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Customers</span>
              </button>
            )}

            {hasModule('payments') && (
              <button
                id="nav-payments-btn"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'payments'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Payments</span>
              </button>
            )}

            {hasModule('settings') && (
              <button
                id="nav-settings-btn"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Settings</span>
              </button>
            )}

            {hasModule('users') && (
              <button
                id="nav-users-btn"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Users</span>
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3 shrink-0">
            {user?.role === 'admin' && (
              <button
                id="audit-log-btn"
                onClick={onOpenAuditLogs}
                title="System Audit Logs"
                className="p-1.5 lg:p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}

            <div className="text-right hidden sm:block">
              <div className="text-xs lg:text-sm font-semibold text-white leading-tight">{user?.full_name || user?.email}</div>
              <div className="text-[10px] lg:text-[11px] text-orange-400 capitalize font-medium">{user?.role}</div>
            </div>

            <button
              id="logout-btn"
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 lg:px-3 py-1.5 rounded-lg border border-slate-700 transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
