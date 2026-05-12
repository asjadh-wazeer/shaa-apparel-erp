import React, { useState } from 'react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  status: string;
}

const users: UserRecord[] = [
  { id: 'USR-001', name: 'Dishan P.', email: 'dishan@shaaapparel.com', role: 'CEO & Founder', department: 'Management', lastLogin: '2026-05-07 08:05', status: 'ACTIVE' },
  { id: 'USR-002', name: 'Amara S.', email: 'amara@shaaapparel.com', role: 'Fashion Designer', department: 'Design', lastLogin: '2026-05-07 08:30', status: 'ACTIVE' },
  { id: 'USR-003', name: 'Kasun P.', email: 'kasun@shaaapparel.com', role: 'Cutting Supervisor', department: 'Production', lastLogin: '2026-05-07 07:55', status: 'ACTIVE' },
  { id: 'USR-004', name: 'Nisha R.', email: 'nisha@shaaapparel.com', role: 'Fashion Designer', department: 'Design', lastLogin: '2026-05-07 08:45', status: 'ACTIVE' },
  { id: 'USR-005', name: 'Priya M.', email: 'priya@shaaapparel.com', role: 'QC Inspector', department: 'Quality', lastLogin: '2026-05-07 08:15', status: 'ACTIVE' },
  { id: 'USR-006', name: 'Roshan F.', email: 'roshan@shaaapparel.com', role: 'Sewing Supervisor', department: 'Production', lastLogin: '2026-05-07 07:50', status: 'ACTIVE' },
  { id: 'USR-007', name: 'Chamari W.', email: 'chamari@shaaapparel.com', role: 'Sewing Operator', department: 'Production', lastLogin: '2026-05-06 09:00', status: 'ACTIVE' },
];

const rolePermissions = [
  { role: 'CEO & Founder', access: ['All Modules', 'Full Access'], color: '#1D4ED8' },
  { role: 'General Manager', access: ['Production', 'Reports', 'HR', 'Costing'], color: '#7C3AED' },
  { role: 'Fashion Designer', access: ['Design Module', 'Product Tracker'], color: '#EC4899' },
  { role: 'Pattern Maker', access: ['Pattern Making', 'Product Tracker'], color: '#8B5CF6' },
  { role: 'Cutting Supervisor', access: ['Cutting Dept', 'Product Tracker'], color: '#22C55E' },
  { role: 'Sewing Supervisor', access: ['Sewing Dept', 'Product Tracker'], color: '#F97316' },
  { role: 'QC Inspector', access: ['Quality Control', 'Product Tracker'], color: '#06B6D4' },
  { role: 'Storekeeper', access: ['Warehouse', 'Purchasing', 'Suppliers'], color: '#84CC16' },
];

type ActiveTab = 'users' | 'roles';

export function UserRolesPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users, roles and access permissions</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            + Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['ID', 'Name', 'Email', 'Role', 'Department', 'Last Login', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.department}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{row.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rolePermissions.map((rp) => (
                <div key={rp.role} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rp.color }}
                    />
                    <h3 className="font-semibold text-gray-800">{rp.role}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rp.access.map((a) => (
                      <span key={a} className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Add User</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" placeholder="user@shaaapparel.com" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {rolePermissions.map((r) => <option key={r.role}>{r.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input type="password" placeholder="Min 8 characters" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1D4ED8' }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
