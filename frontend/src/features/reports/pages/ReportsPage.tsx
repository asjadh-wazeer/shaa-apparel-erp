import React, { useState, useMemo } from 'react';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetProductionReportQuery,
  useGetInventoryReportQuery,
  useGetAttendanceReportQuery,
  useGetQualityReportQuery,
  useGetKpiReportQuery,
} from '../api/reports.api';
import type {
  ProductionReportRow,
  InventoryReportRow,
  AttendanceReportRow,
  QualityReportRow,
  KpiReportRow,
} from '../types/reports.types';

// ── CSV export utility ────────────────────────────────────────────────────────

function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Report types config ───────────────────────────────────────────────────────

type ReportType = 'production' | 'inventory' | 'attendance' | 'quality' | 'kpi';

const REPORT_CONFIG: { type: ReportType; label: string; description: string; icon: string; module: string }[] = [
  { type: 'production', label: 'Production Summary', description: 'All orders with batch counts, completed vs planned qty, and yield rates.', icon: '🏭', module: 'Production' },
  { type: 'inventory', label: 'Inventory Status', description: 'Current stock levels, low-stock flags, average costs, and warehouse breakdown.', icon: '📦', module: 'Inventory' },
  { type: 'attendance', label: 'Attendance & HR', description: 'Monthly staff attendance summary — present, absent, late, and rate per employee.', icon: '👥', module: 'HR' },
  { type: 'quality', label: 'Quality Control', description: 'QC inspection results, pass rates, defect counts by severity.', icon: '✅', module: 'QC' },
  { type: 'kpi', label: 'KPI & Incentives', description: 'Employee KPI records with target vs actual achievement and incentive amounts.', icon: '📈', module: 'HR' },
];

const MODULE_COLORS: Record<string, string> = {
  Production: 'bg-indigo-50 text-indigo-700',
  Inventory: 'bg-blue-50 text-blue-700',
  HR: 'bg-purple-50 text-purple-700',
  QC: 'bg-green-50 text-green-700',
};

// ── Shared table wrapper ──────────────────────────────────────────────────────

function ReportTable({ headers, children, loading, empty }: {
  headers: string[];
  children: React.ReactNode;
  loading: boolean;
  empty: boolean;
}): React.JSX.Element {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (empty) {
    return <div className="py-10 text-center text-sm text-gray-400">No data found for the selected filters.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ── Per-report tables ─────────────────────────────────────────────────────────

function ProductionTable({ data, loading }: { data: ProductionReportRow[]; loading: boolean }): React.JSX.Element {
  return (
    <ReportTable
      headers={['Order #', 'Description', 'Status', 'Planned Qty', 'Batches', 'Completed', 'Rejected', 'Yield %']}
      loading={loading}
      empty={!loading && data.length === 0}
    >
      {data.map((row) => (
        <tr key={row.orderNumber} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.orderNumber}</td>
          <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{row.description}</td>
          <td className="px-4 py-3">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              row.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>{row.status.replace('_', ' ')}</span>
          </td>
          <td className="px-4 py-3 text-gray-700">{row.plannedQty.toLocaleString()}</td>
          <td className="px-4 py-3 text-gray-600">{row.batchCount}</td>
          <td className="px-4 py-3 text-green-700 font-medium">{row.totalCompleted.toLocaleString()}</td>
          <td className="px-4 py-3 text-red-600">{row.totalRejected > 0 ? row.totalRejected : '—'}</td>
          <td className="px-4 py-3">
            <span className={`font-bold ${row.yieldRate >= 90 ? 'text-green-600' : row.yieldRate >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
              {row.yieldRate}%
            </span>
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

function InventoryTable({ data, loading }: { data: InventoryReportRow[]; loading: boolean }): React.JSX.Element {
  return (
    <ReportTable
      headers={['SKU', 'Name', 'Category', 'Unit', 'Stock', 'Reorder Point', 'Avg Cost', 'Supplier', 'Status']}
      loading={loading}
      empty={!loading && data.length === 0}
    >
      {data.map((row) => (
        <tr key={row.sku} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.sku}</td>
          <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate">{row.name}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.category ?? '—'}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.unit}</td>
          <td className="px-4 py-3">
            <span className={`font-bold ${row.isOutOfStock ? 'text-red-600' : row.isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
              {row.currentStock.toLocaleString()}
            </span>
          </td>
          <td className="px-4 py-3 text-gray-500 text-xs">{row.reorderPoint ?? '—'}</td>
          <td className="px-4 py-3 text-xs text-gray-600">
            {row.averageCost > 0 ? `LKR ${Number(row.averageCost).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.supplier ?? '—'}</td>
          <td className="px-4 py-3">
            {row.isOutOfStock ? (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">Out of Stock</span>
            ) : row.isLowStock ? (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">Low Stock</span>
            ) : (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">OK</span>
            )}
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

function AttendanceTable({ data, loading }: { data: AttendanceReportRow[]; loading: boolean }): React.JSX.Element {
  return (
    <ReportTable
      headers={['Code', 'Name', 'Department', 'Job Title', 'Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Total', 'Rate']}
      loading={loading}
      empty={!loading && data.length === 0}
    >
      {data.map((row) => (
        <tr key={row.employeeCode} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.employeeCode}</td>
          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.department}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.jobTitle}</td>
          <td className="px-4 py-3 text-green-700 font-medium">{row.present}</td>
          <td className="px-4 py-3 text-red-600">{row.absent > 0 ? row.absent : '—'}</td>
          <td className="px-4 py-3 text-amber-600">{row.late > 0 ? row.late : '—'}</td>
          <td className="px-4 py-3 text-gray-500">{row.halfDay > 0 ? row.halfDay : '—'}</td>
          <td className="px-4 py-3 text-blue-600">{row.onLeave > 0 ? row.onLeave : '—'}</td>
          <td className="px-4 py-3 text-gray-700 font-semibold">{row.total}</td>
          <td className="px-4 py-3">
            <span className={`font-bold text-sm ${row.attendanceRate >= 90 ? 'text-green-600' : row.attendanceRate >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
              {row.attendanceRate}%
            </span>
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

function QualityTable({ data, loading }: { data: QualityReportRow[]; loading: boolean }): React.JSX.Element {
  return (
    <ReportTable
      headers={['Check #', 'Order', 'Result', 'Inspected', 'Passed', 'Failed', 'Pass %', 'Minor', 'Major', 'Critical', 'Approved', 'Date']}
      loading={loading}
      empty={!loading && data.length === 0}
    >
      {data.map((row) => (
        <tr key={row.checkNumber} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.checkNumber}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.orderNumber}</td>
          <td className="px-4 py-3">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.result === 'PASSED' ? 'bg-green-100 text-green-700' :
              row.result === 'FAILED' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>{row.result.replace('_', ' ')}</span>
          </td>
          <td className="px-4 py-3 text-gray-700">{row.inspectedQty}</td>
          <td className="px-4 py-3 text-green-700 font-medium">{row.passedQty}</td>
          <td className="px-4 py-3 text-red-600">{row.failedQty > 0 ? row.failedQty : '—'}</td>
          <td className="px-4 py-3">
            <span className={`font-bold ${row.passRate >= 95 ? 'text-green-600' : row.passRate >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
              {row.passRate}%
            </span>
          </td>
          <td className="px-4 py-3 text-yellow-600 text-xs">{row.minorDefects > 0 ? row.minorDefects : '—'}</td>
          <td className="px-4 py-3 text-orange-600 text-xs">{row.majorDefects > 0 ? row.majorDefects : '—'}</td>
          <td className="px-4 py-3 text-red-700 text-xs font-semibold">{row.criticalDefects > 0 ? row.criticalDefects : '—'}</td>
          <td className="px-4 py-3 text-xs">
            {row.approved ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">{new Date(row.inspectedAt).toLocaleDateString()}</td>
        </tr>
      ))}
    </ReportTable>
  );
}

function KpiTable({ data, loading }: { data: KpiReportRow[]; loading: boolean }): React.JSX.Element {
  return (
    <ReportTable
      headers={['Code', 'Name', 'Department', 'Month/Year', 'Metric', 'Target', 'Actual', 'Achievement', 'Incentive']}
      loading={loading}
      empty={!loading && data.length === 0}
    >
      {data.map((row, i) => (
        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
          <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.employeeCode}</td>
          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.department}</td>
          <td className="px-4 py-3 text-xs text-gray-500">{row.month}/{row.year}</td>
          <td className="px-4 py-3 text-xs text-gray-700 font-medium">{row.metric}</td>
          <td className="px-4 py-3 text-gray-600">{row.target ?? '—'}</td>
          <td className="px-4 py-3 text-gray-800 font-semibold">{row.actual}</td>
          <td className="px-4 py-3">
            {row.achievement !== null ? (
              <span className={`font-bold ${row.achievement >= 100 ? 'text-green-600' : row.achievement >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                {row.achievement}%
              </span>
            ) : '—'}
          </td>
          <td className="px-4 py-3 text-sm font-medium text-indigo-700">
            {row.incentiveAmount ? `LKR ${Number(row.incentiveAmount).toLocaleString()}` : '—'}
          </td>
        </tr>
      ))}
    </ReportTable>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ReportsPage(): React.JSX.Element {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);

  // Filters
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [kpiMonth, setKpiMonth] = useState(today.getMonth() + 1);
  const [kpiYear, setKpiYear] = useState(today.getFullYear());
  const [prodStatus, setProdStatus] = useState('');

  // Queries — only fires when report is active
  const { data: prodData, isLoading: prodLoading } = useGetProductionReportQuery(
    { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, status: prodStatus || undefined },
    { skip: activeReport !== 'production' },
  );
  const { data: invData, isLoading: invLoading } = useGetInventoryReportQuery(
    undefined,
    { skip: activeReport !== 'inventory' },
  );
  const { data: attData, isLoading: attLoading } = useGetAttendanceReportQuery(
    { month },
    { skip: activeReport !== 'attendance' },
  );
  const { data: qcData, isLoading: qcLoading } = useGetQualityReportQuery(
    { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    { skip: activeReport !== 'quality' },
  );
  const { data: kpiData, isLoading: kpiLoading } = useGetKpiReportQuery(
    { month: kpiMonth, year: kpiYear },
    { skip: activeReport !== 'kpi' },
  );

  const isLoading = prodLoading || invLoading || attLoading || qcLoading || kpiLoading;

  const csvRows = useMemo(() => {
    if (activeReport === 'production') return (prodData?.data ?? []) as unknown as Record<string, unknown>[];
    if (activeReport === 'inventory') return (invData?.data ?? []).map(({ warehouseBreakdown, ...rest }) => rest) as unknown as Record<string, unknown>[];
    if (activeReport === 'attendance') return (attData?.data ?? []) as unknown as Record<string, unknown>[];
    if (activeReport === 'quality') return (qcData?.data ?? []) as unknown as Record<string, unknown>[];
    if (activeReport === 'kpi') return (kpiData?.data ?? []) as unknown as Record<string, unknown>[];
    return [];
  }, [activeReport, prodData, invData, attData, qcData, kpiData]);

  const handleExport = () => {
    if (!activeReport) return;
    exportCsv(`${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`, csvRows);
  };

  const activeConfig = REPORT_CONFIG.find((r) => r.type === activeReport);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and export reports across all modules</p>
      </div>

      {/* Report selector cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {REPORT_CONFIG.map((report) => (
          <button
            key={report.type}
            onClick={() => setActiveReport(report.type)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              activeReport === report.type
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{report.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{report.label}</p>
                <span className={`inline-block mt-1 text-xs rounded px-1.5 py-0.5 font-medium ${MODULE_COLORS[report.module] ?? 'bg-gray-100 text-gray-600'}`}>
                  {report.module}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active report panel */}
      {activeReport && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Panel header with filters + export */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{activeConfig?.label}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{activeConfig?.description}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={isLoading || csvRows.length === 0}
              >
                Export CSV
              </Button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 mt-3">
              {(activeReport === 'production' || activeReport === 'quality') && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-500 text-xs font-medium whitespace-nowrap">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-500 text-xs font-medium whitespace-nowrap">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                </>
              )}
              {activeReport === 'production' && (
                <select
                  value={prodStatus}
                  onChange={(e) => setProdStatus(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">All Statuses</option>
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'].map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
              {activeReport === 'attendance' && (
                <div className="flex items-center gap-2">
                  <label className="text-gray-500 text-xs font-medium">Month</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="input text-sm"
                  />
                </div>
              )}
              {activeReport === 'kpi' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-500 text-xs font-medium">Month</label>
                    <select
                      value={kpiMonth}
                      onChange={(e) => setKpiMonth(Number(e.target.value))}
                      className="input text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-500 text-xs font-medium">Year</label>
                    <input
                      type="number"
                      value={kpiYear}
                      onChange={(e) => setKpiYear(Number(e.target.value))}
                      min={2020}
                      max={2099}
                      className="input text-sm w-24"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          {activeReport === 'production' && (
            <ProductionTable data={prodData?.data ?? []} loading={prodLoading} />
          )}
          {activeReport === 'inventory' && (
            <InventoryTable data={invData?.data ?? []} loading={invLoading} />
          )}
          {activeReport === 'attendance' && (
            <AttendanceTable data={attData?.data ?? []} loading={attLoading} />
          )}
          {activeReport === 'quality' && (
            <QualityTable data={qcData?.data ?? []} loading={qcLoading} />
          )}
          {activeReport === 'kpi' && (
            <KpiTable data={kpiData?.data ?? []} loading={kpiLoading} />
          )}

          {/* Row count footer */}
          {!isLoading && csvRows.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {csvRows.length} row{csvRows.length !== 1 ? 's' : ''} loaded
            </div>
          )}
        </div>
      )}

      {/* Empty state — no report selected */}
      {!activeReport && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-600 font-medium">Select a report above to load data</p>
          <p className="text-sm text-gray-400 mt-1">Reports load on demand — use filters to narrow the results, then export as CSV.</p>
        </div>
      )}
    </div>
  );
}
