import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { TopHeader } from './components/TopHeader.js';
import { LoginView } from './components/LoginView.js';
import { Dashboard } from './components/Dashboard.js';
import { InvoiceList } from './components/InvoiceList.js';
import { InvoiceModal } from './components/InvoiceModal.js';
import { InvoiceDetailModal } from './components/InvoiceDetailModal.js';
import { OverdueModal } from './components/OverdueModal.js';
import { CustomerList } from './components/CustomerList.js';
import { CustomerModal } from './components/CustomerModal.js';
import { CustomerDetailModal } from './components/CustomerDetailModal.js';
import { PaymentList } from './components/PaymentList.js';
import { PaymentModal } from './components/PaymentModal.js';
import { CompanySettingsView } from './components/CompanySettings.js';
import { UserManagementView } from './components/UserManagement.js';
import { AuditLogsModal } from './components/AuditLogsModal.js';
import { Invoice, Customer, CompanySettings, BankAccount } from './types.js';
import { apiRequest } from './services/api.js';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Selected Entities & Editing State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<Invoice | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Company Settings & Default Bank
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'SHREE SANWARIYA LOGISTICS',
    gstin: '24AABCS1429B1Z8',
    pan: 'AABCS1429B',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'billing@shreesanwariya.com',
    address: 'Opp. Transport Nagar, Ring Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin: '382405',
    invoice_prefix: 'SSL',
    terms: "1. Goods are carried at owner's risk.\n2. All disputes subject to Ahmedabad jurisdiction only.\n3. Payment to be made within credit period.",
  });
  const [defaultBank, setDefaultBank] = useState<BankAccount | undefined>(undefined);

  const fetchSettingsAndBank = async () => {
    try {
      const compRes = await apiRequest<CompanySettings>('/settings/company');
      if (compRes) setCompanySettings(compRes);

      const bankRes = await apiRequest<any>('/settings/banks');
      const list: BankAccount[] = Array.isArray(bankRes) ? bankRes : (bankRes?.accounts || bankRes?.items || []);
      if (list.length > 0) {
        const def = list.find(b => b.is_default) || list[0];
        setDefaultBank(def);
      }
    } catch (err) {
      console.error('Failed to load global company settings', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettingsAndBank();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex font-sans selection:bg-orange-500 selection:text-white">
      {/* Left Dark Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewInvoice={() => {
          setEditingInvoice(null);
          setShowInvoiceModal(true);
        }}
        onNewCustomer={() => setShowCustomerModal(true)}
        onReceivePayment={() => {
          setTargetInvoiceForPayment(null);
          setShowPaymentModal(true);
        }}
        onViewOverdue={() => setShowOverdueModal(true)}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
        isOpenMobile={sidebarOpenMobile}
        setIsOpenMobile={setSidebarOpenMobile}
        companySettings={companySettings}
      />

      {/* Main Content Area on the right */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpenMobile(true)}
          onNewInvoice={() => {
            setEditingInvoice(null);
            setShowInvoiceModal(true);
          }}
          onReceivePayment={() => {
            setTargetInvoiceForPayment(null);
            setShowPaymentModal(true);
          }}
          onNewCustomer={() => setShowCustomerModal(true)}
          onOpenAuditLogs={() => setShowAuditLogs(true)}
          companySettings={companySettings}
        />

        {/* Main Body View */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              key={refreshKey}
              onNewInvoice={() => {
                setEditingInvoice(null);
                setShowInvoiceModal(true);
              }}
              onNewCustomer={() => setShowCustomerModal(true)}
              onReceivePayment={() => {
                setTargetInvoiceForPayment(null);
                setShowPaymentModal(true);
              }}
              onViewOverdue={() => setShowOverdueModal(true)}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              companySettings={companySettings}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceList
              key={refreshKey}
              onNewInvoice={() => {
                setEditingInvoice(null);
                setShowInvoiceModal(true);
              }}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onEditInvoice={(inv) => {
                setEditingInvoice(inv);
                setShowInvoiceModal(true);
              }}
              onRecordPayment={(inv) => {
                setTargetInvoiceForPayment(inv);
                setShowPaymentModal(true);
              }}
              companySettings={companySettings}
              defaultBank={defaultBank}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              key={refreshKey}
              onNewCustomer={() => setShowCustomerModal(true)}
              onSelectCustomer={(cust) => setSelectedCustomer(cust)}
              companySettings={companySettings}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentList
              key={refreshKey}
              onNewPayment={() => {
                setTargetInvoiceForPayment(null);
                setShowPaymentModal(true);
              }}
              companySettings={companySettings}
            />
          )}

          {activeTab === 'settings' && (
            <CompanySettingsView onRefreshSettings={fetchSettingsAndBank} />
          )}

          {activeTab === 'users' && <UserManagementView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-medium">
              &copy; {new Date().getFullYear()} {companySettings.name} · GST Transport & Freight Billing
            </div>
            <div className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              GSTIN: {companySettings.gstin} · SAC: 996511
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          invoiceToEdit={editingInvoice}
          onClose={() => {
            setShowInvoiceModal(false);
            setEditingInvoice(null);
          }}
          onSuccess={() => {
            setShowInvoiceModal(false);
            setEditingInvoice(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEditInvoice={(inv) => {
            setSelectedInvoice(null);
            setEditingInvoice(inv);
            setShowInvoiceModal(true);
          }}
          onRecordPayment={(inv) => {
            setSelectedInvoice(null);
            setTargetInvoiceForPayment(inv);
            setShowPaymentModal(true);
          }}
          onRefresh={() => {
            setRefreshKey(k => k + 1);
          }}
          companySettings={companySettings}
          defaultBank={defaultBank}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onNewInvoice={(cust) => {
            setSelectedCustomer(null);
            setShowInvoiceModal(true);
          }}
          companySettings={companySettings}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          initialInvoice={targetInvoiceForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setTargetInvoiceForPayment(null);
          }}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {showOverdueModal && (
        <OverdueModal onClose={() => setShowOverdueModal(false)} />
      )}

      {showAuditLogs && (
        <AuditLogsModal onClose={() => setShowAuditLogs(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
