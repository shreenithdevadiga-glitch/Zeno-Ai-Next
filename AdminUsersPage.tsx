import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  KeyRound,
  Ban,
  CheckCircle,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  AlertTriangle,
  FileText,
  Brain,
  Layers
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected User Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Confirmation State
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'activate' | 'change_role' | 'change_plan' | 'revoke_sessions';
    user: any;
    targetValue?: string;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(planFilter && { plan: planFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const res = await apiFetch(`/api/admin/users?${queryParams.toString()}`);
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, planFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const openUserDetail = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setDetailLoading(true);
      const res = await apiFetch(`/api/admin/users/${userId}`);
      setUserDetail(res.user);
    } catch (err: any) {
      alert('Could not load user details: ' + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const executeAction = async () => {
    if (!actionModal) return;
    const { type, user, targetValue } = actionModal;

    try {
      if (type === 'suspend' || type === 'activate') {
        const nextStatus = type === 'suspend' ? 'suspended' : 'active';
        await apiFetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus })
        });
      } else if (type === 'change_role') {
        await apiFetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ role: targetValue })
        });
      } else if (type === 'change_plan') {
        await apiFetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ plan: targetValue })
        });
      } else if (type === 'revoke_sessions') {
        await apiFetch(`/api/admin/users/${user.id}/revoke-sessions`, {
          method: 'POST'
        });
      }

      setActionModal(null);
      fetchUsers();
      if (selectedUserId === user.id) {
        openUserDetail(user.id);
      }
    } catch (err: any) {
      alert('Action failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>User Directory & Identity Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage authentication accounts, role permissions, plan entitlements, and active sessions.
          </p>
        </div>

        <a
          href="/api/admin/export/users"
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition w-fit"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Directory (JSON)</span>
        </a>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl glass-panel-elevated border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="security-admin">Security Admin</option>
            <option value="billing-admin">Billing Admin</option>
            <option value="analyst">Analyst</option>
            <option value="user">User</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Tokens Used</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                        {u.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border ${
                      u.role === 'super-admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : u.role === 'admin'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    }`}>
                      {u.role?.toUpperCase() || 'USER'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border uppercase ${
                      u.plan === 'enterprise'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : u.plan === 'pro'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : u.plan === 'starter'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                    }`}>
                      {u.plan || 'free'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${
                      u.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {u.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {u.active_sessions || 0} active
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    {(u.total_tokens || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {u.created_at ? u.created_at.slice(0, 10) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openUserDetail(u.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="View Full Profile & Diagnostics"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {u.status === 'active' ? (
                        <button
                          onClick={() => setActionModal({ type: 'suspend', user: u })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Suspend User Account"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionModal({ type: 'activate', user: u })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                          title="Activate User Account"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {pagination.page} of {pagination.pages || 1}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer Modal */}
      {selectedUserId && userDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated border border-white/15 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{userDetail.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                    {userDetail.role}
                  </span>
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{userDetail.email} • ID: {userDetail.id}</div>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-slate-400 font-mono">Total Requests</div>
                <div className="text-base font-bold text-white font-mono">{userDetail.stats?.requests || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-slate-400 font-mono">Tokens Processed</div>
                <div className="text-base font-bold text-cyan-400 font-mono">{(userDetail.stats?.tokens || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-slate-400 font-mono">Estimated Cost</div>
                <div className="text-base font-bold text-emerald-400 font-mono">${userDetail.stats?.costUsd?.toFixed(4) || '0.0000'}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] text-slate-400 font-mono">Storage Used</div>
                <div className="text-base font-bold text-purple-400 font-mono">
                  {Math.round((userDetail.stats?.storageBytes || 0) / 1024)} KB
                </div>
              </div>
            </div>

            {/* Active Sessions & Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Active Device Sessions</h4>
                {userDetail.sessions?.length > 0 && (
                  <button
                    onClick={() => setActionModal({ type: 'revoke_sessions', user: userDetail })}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Revoke All Sessions
                  </button>
                )}
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {userDetail.sessions?.map((s: any) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-slate-300">
                    <div>
                      <div>IP: {s.ip_address || '127.0.0.1'} • {s.user_agent ? s.user_agent.slice(0, 40) + '...' : 'Browser'}</div>
                      <div className="text-[10px] text-slate-500">Last active: {s.last_active_at}</div>
                    </div>
                  </div>
                ))}
                {(!userDetail.sessions || userDetail.sessions.length === 0) && (
                  <div className="text-slate-500 text-xs py-2">No active sessions.</div>
                )}
              </div>
            </div>

            {/* Admin Management Actions */}
            <div className="border-t border-white/10 pt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActionModal({ type: 'change_role', user: userDetail, targetValue: userDetail.role === 'admin' ? 'user' : 'admin' })}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200"
              >
                Change Role ({userDetail.role === 'admin' ? 'Demote to User' : 'Promote to Admin'})
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Plan:</span>
                <select
                  value={userDetail.plan || 'free'}
                  onChange={(e) => setActionModal({ type: 'change_plan', user: userDetail, targetValue: e.target.value })}
                  className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer uppercase"
                >
                  <option value="free" className="bg-[#18181b] text-slate-200">FREE</option>
                  <option value="starter" className="bg-[#18181b] text-slate-200">STARTER</option>
                  <option value="pro" className="bg-[#18181b] text-slate-200">PRO</option>
                  <option value="enterprise" className="bg-[#18181b] text-slate-200">ENTERPRISE</option>
                </select>
              </div>

              <button
                onClick={() => setActionModal({ type: userDetail.status === 'active' ? 'suspend' : 'activate', user: userDetail })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  userDetail.status === 'active'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {userDetail.status === 'active' ? 'Suspend Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/20 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Administrative Operation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to execute <strong className="text-white uppercase font-mono">{actionModal.type}</strong> for{' '}
              <strong className="text-cyan-400">{actionModal.user.email}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-medium hover:bg-cyan-600 transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
