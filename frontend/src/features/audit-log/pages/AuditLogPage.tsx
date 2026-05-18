import React, { useState } from 'react';
import { useGetAuditLogsQuery } from '../api/audit-log.api';
import { Button } from '../../../shared/components/ui/Button/Button';

const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'];

const actionStyle: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-600',
  LOGOUT: 'bg-gray-100 text-gray-600',
  EXPORT: 'bg-purple-100 text-purple-700',
  IMPORT: 'bg-purple-100 text-purple-700',
  APPROVE: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
};

export function AuditLogPage(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, isError } = useGetAuditLogsQuery({
    page,
    limit: 50,
    ...(actionFilter && { action: actionFilter }),
    ...(entityTypeFilter && { entityType: entityTypeFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  const handleClear = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">System-wide record of all create, update, delete, and auth events</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input text-sm"
            >
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <input
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
              placeholder="e.g. ProductionOrder"
              className="input text-sm w-44"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input text-sm"
            />
          </div>
          {(actionFilter || entityTypeFilter || dateFrom || dateTo) && (
            <Button size="sm" variant="secondary" onClick={handleClear}>Clear</Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load audit logs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      No audit log entries found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionStyle[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{log.entityType}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400 max-w-[140px] truncate" title={log.entityId}>
                        {log.entityId}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[240px] truncate" title={log.description ?? ''}>
                        {log.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {meta.total} entries &bull; Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
