import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Lock, 
  Mail, 
  UserPlus, 
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { User } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

export const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // New User Form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'accountant'>('staff');
  const [modules, setModules] = useState<string[]>(['dashboard', 'invoices', 'customers', 'payments']);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ users: User[] }>('/users');
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
          role,
          modules,
        }),
      });
      setShowAdd(false);
      setEmail('');
      setFullName('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleModuleToggle = (mod: string) => {
    if (modules.includes(mod)) {
      setModules(modules.filter(m => m !== mod));
    } else {
      setModules([...modules, mod]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const ALL_MODULES = [
    { key: 'dashboard', label: 'Dashboard Overview' },
    { key: 'invoices', label: 'Invoices & Billing' },
    { key: 'customers', label: 'Customer Registry' },
    { key: 'payments', label: 'Payments & Receipts' },
    { key: 'settings', label: 'Company Settings' },
    { key: 'users', label: 'User Administration' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Staff & User Administration</span>
            <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-200">
              Role-Based Access
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative credentials, operators, accountants, and functional module permissions
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* User Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Accessible Modules</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.full_name || 'Staff Member'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        u.role === 'admin'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : u.role === 'accountant'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.modules || []).map((m) => (
                          <span key={m} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md border border-slate-200">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {currentUser?.role === 'admin' && u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Create User Account</h3>
              <button 
                onClick={() => setShowAdd(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Grant role-based credentials for staff members</p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Mukesh Sharma"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address (Username)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  placeholder="mukesh@shreesanwariya.com"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">User Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as any;
                    setRole(r);
                    if (r === 'admin') {
                      setModules(['dashboard', 'invoices', 'customers', 'payments', 'settings', 'users']);
                    } else if (r === 'accountant') {
                      setModules(['dashboard', 'invoices', 'customers', 'payments', 'settings']);
                    } else {
                      setModules(['dashboard', 'invoices', 'customers', 'payments']);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="staff">Staff Operator (Invoices & Logistics)</option>
                  <option value="accountant">Accountant (Billing & Payments)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Module Access Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.includes(m.key)}
                        onChange={() => handleModuleToggle(m.key)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-0"
                      />
                      <span className="text-slate-800 text-[11px] font-medium">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
