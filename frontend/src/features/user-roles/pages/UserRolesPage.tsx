import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  type SystemUser,
} from '../api/users.api';

type ActiveTab = 'users' | 'roles';

const createUserSchema = z.object({
  firstName:  z.string().min(1, 'Required'),
  lastName:   z.string().min(1, 'Required'),
  email:      z.string().email('Invalid email'),
  username:   z.string().min(3, 'Min 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  password:   z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase and number'),
  phone:      z.string().optional(),
  roleIds:    z.array(z.string()).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:               'bg-green-100 text-green-700',
  INACTIVE:             'bg-gray-100 text-gray-500',
  SUSPENDED:            'bg-red-100 text-red-600',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.data ?? [];
  const [createUser, { isLoading }] = useCreateUserMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (values: CreateUserForm) => {
    try {
      await createUser({
        ...values,
        roleIds: values.roleIds?.filter(Boolean),
      }).unwrap();
      toast.success('User created successfully');
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to create user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name <span className="text-red-500">*</span></label>
              <input {...register('firstName')} type="text" className="input w-full" />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">Last Name <span className="text-red-500">*</span></label>
              <input {...register('lastName')} type="text" className="input w-full" />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Email <span className="text-red-500">*</span></label>
            <input {...register('email')} type="email" placeholder="user@shaaapparel.com" className="input w-full" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Username <span className="text-red-500">*</span></label>
            <input {...register('username')} type="text" placeholder="Letters, numbers, underscores" className="input w-full" />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>
          <div>
            <label className="form-label">Password <span className="text-red-500">*</span></label>
            <input {...register('password')} type="password" placeholder="Min 8 chars, uppercase, lowercase, number" className="input w-full" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input {...register('phone')} type="text" placeholder="+94771234567" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select {...register('roleIds.0')} className="input w-full">
              <option value="">— No role —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStatusModal({ user, onClose }: { user: SystemUser; onClose: () => void }) {
  const [status, setStatus] = useState(user.status);
  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.data ?? [];
  const [selectedRoleId, setSelectedRoleId] = useState(user.roles[0]?.id ?? '');
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const handleSave = async () => {
    try {
      await updateUser({
        id: user.id,
        data: {
          status,
          roleIds: selectedRoleId ? [selectedRoleId] : [],
        },
      }).unwrap();
      toast.success('User updated');
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to update user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-full">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label">Role</label>
            <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="input w-full">
              <option value="">— No role —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={isLoading} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserRolesPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetUsersQuery({ page, limit: 20, search: search || undefined });
  const { data: rolesData } = useGetRolesQuery();
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const roles = rolesData?.data ?? [];

  const handleDelete = async (u: SystemUser) => {
    if (!confirm(`Delete user ${u.firstName} ${u.lastName}? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id).unwrap();
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users, roles and access permissions</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[{ key: 'users' as const, label: 'Users' }, { key: 'roles' as const, label: 'Roles & Permissions' }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-sm text-red-600">Failed to load users.</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 font-medium">No users found</p>
                <p className="text-gray-400 text-sm mt-1">Create a user to get started.</p>
                <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  + Add User
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Name', 'Email', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((row) => (
                      <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.email}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.username}</td>
                        <td className="px-4 py-3">
                          {row.roles.length > 0 ? (
                            <span className="rounded px-2 py-0.5 text-xs bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                              {row.roles[0].name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(row.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditUser(row)}
                              className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
                <span>{meta.total} total users</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <span className="text-xs">{page} / {meta.totalPages}</span>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Roles tab */}
        {activeTab === 'roles' && (
          <div className="p-5">
            {roles.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No roles found.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const modules = role.rolePermissions
                    ? [...new Set(role.rolePermissions.map((rp) => rp.permission.module.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())))]
                    : [];
                  return (
                    <div key={role.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-800">{role.name}</h3>
                        {role.isSystem && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">System</span>
                        )}
                      </div>
                      {role.description && <p className="text-xs text-gray-400 mb-2">{role.description}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {modules.length > 0 ? (
                          modules.slice(0, 8).map((m) => (
                            <span key={m} className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">All permissions</span>
                        )}
                        {modules.length > 8 && (
                          <span className="text-xs text-gray-400">+{modules.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
      {editUser && <EditStatusModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}
