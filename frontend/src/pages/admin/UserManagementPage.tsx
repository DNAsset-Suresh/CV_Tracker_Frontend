import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  KeyRound,
  Shield,
  MoreVertical,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { ClassificationBadge, StatusBadge } from '../../components/common/Badge';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states for creating user
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HR',
    managerClassification: 'IT Development Manager',
    phone: '',
  });
  const [createError, setCreateError] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
        classification: classificationFilter || undefined,
        status: statusFilter || undefined,
      });

      if (data.success) {
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, classificationFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setActionLoading(true);

    try {
      const payload: any = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        phone: createForm.phone,
      };

      if (createForm.role === 'Manager') {
        payload.managerClassification = createForm.managerClassification;
      }

      const res = await userService.createUser(payload);
      if (res.success) {
        setIsCreateOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'HR',
          managerClassification: 'IT Development Manager',
          phone: '',
        });
        fetchUsers();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await userService.toggleUserStatus(selectedUser._id);
      setIsConfirmToggleOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Status toggle failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordInput) return;
    setActionLoading(true);
    try {
      await userService.resetUserPassword(selectedUser._id, newPasswordInput);
      setIsResetOpen(false);
      setSelectedUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Password reset failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and maintain role-based user accounts and mandatory manager classifications.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError('');
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Create New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Manager">Manager</option>
          </select>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Classifications</option>
            <option value="IT Development Manager">IT Development Manager</option>
            <option value="Advocate Manager">Advocate Manager</option>
            <option value="Field Executive Manager">Field Executive Manager</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Manager Classification</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-slate-400 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'Manager' ? (
                          <ClassificationBadge classification={u.managerClassification} />
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={u.accountStatus} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPasswordInput('');
                              setIsResetOpen(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsConfirmToggleOpen(true);
                            }}
                            title={u.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              u.accountStatus === 'Active'
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User Account"
        subtitle="Configure role permissions and manager departmental classification"
      >
        {createError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Corporate Email *
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="e.g. rajesh@company.com"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                System Role *
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-500 text-slate-800"
              >
                <option value="HR">HR</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-teal-500 text-slate-800"
              />
            </div>
          </div>

          {/* Mandatory Manager Classification Field */}
          {createForm.role === 'Manager' && (
            <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 animate-fade-in">
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-900 mb-1">
                Manager Classification * (Mandatory)
              </label>
              <p className="text-[11px] text-teal-700 mb-2">
                Restricts candidate assignments and visibility strictly to this department.
              </p>
              <select
                required
                value={createForm.managerClassification}
                onChange={(e) =>
                  setCreateForm({ ...createForm, managerClassification: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg focus:outline-none focus:border-teal-600 text-slate-900 font-semibold"
              >
                <option value="IT Development Manager">IT Development Manager</option>
                <option value="Advocate Manager">Advocate Manager</option>
                <option value="Field Executive Manager">Field Executive Manager</option>
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset User Password"
        subtitle={`Admin override for ${selectedUser?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold"
            >
              {actionLoading ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate / Activate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmToggleOpen}
        onClose={() => setIsConfirmToggleOpen(false)}
        onConfirm={handleToggleStatus}
        title={`${selectedUser?.accountStatus === 'Active' ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${
          selectedUser?.accountStatus === 'Active' ? 'deactivate' : 'activate'
        } account for "${selectedUser?.name}" (${selectedUser?.email})?`}
        isDanger={selectedUser?.accountStatus === 'Active'}
        confirmLabel={selectedUser?.accountStatus === 'Active' ? 'Deactivate User' : 'Activate User'}
        isLoading={actionLoading}
      />
    </div>
  );
};

