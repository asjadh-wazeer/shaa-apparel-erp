import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import { ROUTES } from '../../../shared/constants';
import { useGetDashboardOverviewQuery } from '../api/dashboard.api';
import type { DashboardPipelineRow } from '../types/dashboard.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_COLOR: Record<string, string> = {
  DESIGN: 'bg-blue-100 text-blue-700',
  PATTERN: 'bg-purple-100 text-purple-700',
  SAMPLE: 'bg-pink-100 text-pink-700',
  CUTTING: 'bg-green-100 text-green-700',
  SEWING: 'bg-orange-100 text-orange-700',
  QC: 'bg-red-100 text-red-700',
  FINISHING: 'bg-teal-100 text-teal-700',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  ON_HOLD: 'bg-amber-100 text-amber-700',
};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  borderColor: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, subColor = 'text-gray-500', borderColor, loading }: StatCardProps): React.JSX.Element {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${borderColor}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      )}
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

// ── Attendance Ring ───────────────────────────────────────────────────────────

interface AttendanceRingProps {
  present: number;
  absent: number;
  late: number;
  total: number;
}

function AttendanceRing({ present, absent, late, total }: AttendanceRingProps): React.JSX.Element {
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="#E5E7EB" strokeWidth="9" />
        <circle
          cx="44" cy="44" r="36" fill="none"
          stroke={pct >= 90 ? '#16A34A' : pct >= 70 ? '#F59E0B' : '#EF4444'}
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill="#111827">
          {pct}%
        </text>
      </svg>
      <div className="space-y-1.5 text-sm">
        {[
          { label: 'Present', value: present, color: 'bg-green-500' },
          { label: 'Late', value: late, color: 'bg-amber-400' },
          { label: 'Absent', value: absent, color: 'bg-red-400' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
            <span className="text-gray-500 w-14">{row.label}</span>
            <span className="font-bold text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pipeline Table ────────────────────────────────────────────────────────────

function PipelineTable({ rows, loading }: { rows: DashboardPipelineRow[]; loading: boolean }): React.JSX.Element {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Production Pipeline</h2>
        <Link to={ROUTES.PRODUCT_TRACKER} className="text-xs font-medium text-indigo-600 hover:underline">
          View All →
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No active production orders.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order #', 'Description', 'Status', 'Current Stage', 'Planned Qty'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{row.description}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.currentStageCode ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_COLOR[row.currentStageCode] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.currentStage}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.plannedQty.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DashboardPage(): React.JSX.Element {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.firstName ?? 'there';

  const { data, isLoading } = useGetDashboardOverviewQuery();
  const overview = data?.data;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}!</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayLabel()}</p>
        </div>
        <Link
          to={ROUTES.PRODUCT_TRACKER}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Track Production
        </Link>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Orders"
          value={overview?.production.active ?? 0}
          sub={`${overview?.production.total ?? 0} total`}
          borderColor="border-indigo-500"
          loading={isLoading}
        />
        <StatCard
          label="Low Stock Alerts"
          value={overview?.inventory.lowStockCount ?? 0}
          sub={`${overview?.inventory.outOfStockCount ?? 0} out of stock`}
          subColor={(overview?.inventory.lowStockCount ?? 0) > 0 ? 'text-red-500' : 'text-gray-500'}
          borderColor="border-amber-400"
          loading={isLoading}
        />
        <StatCard
          label="QC Pass Rate"
          value={`${overview?.qc.passRate ?? 0}%`}
          sub={`${overview?.qc.totalChecks ?? 0} total checks`}
          subColor={(overview?.qc.passRate ?? 0) >= 95 ? 'text-green-600' : 'text-amber-600'}
          borderColor="border-green-500"
          loading={isLoading}
        />
        <StatCard
          label="Pending POs"
          value={overview?.purchasing.pendingOrders ?? 0}
          sub="Submitted / approved"
          borderColor="border-blue-500"
          loading={isLoading}
        />
      </div>

      {/* Second row: pipeline + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Pipeline — 3/5 */}
        <div className="lg:col-span-3">
          <PipelineTable rows={overview?.pipeline ?? []} loading={isLoading} />
        </div>

        {/* Right panel — 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Attendance card */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Today's Attendance</h2>
              <Link to={ROUTES.ATTENDANCE} className="text-xs font-medium text-indigo-600 hover:underline">
                Manage →
              </Link>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />
              ) : overview?.attendance ? (
                <>
                  <AttendanceRing
                    present={overview.attendance.present}
                    absent={overview.attendance.absent}
                    late={overview.attendance.late}
                    total={overview.attendance.total || overview.attendance.activeEmployees}
                  />
                  {overview.attendance.total === 0 && (
                    <p className="text-xs text-gray-400 mt-3 text-center">No attendance marked yet today.</p>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Finished goods + QC mini summary */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Quick Stats</h2>
            {[
              {
                label: 'Finished Goods Ready',
                value: `${overview?.finishedGoods.totalUnits.toLocaleString() ?? 0} units`,
                sub: `across ${overview?.finishedGoods.readySkus ?? 0} SKUs`,
                icon: '📦',
                link: ROUTES.FINISHED_GOODS,
              },
              {
                label: 'QC Passed This Month',
                value: `${overview?.qc.passedThisMonth ?? 0} checks`,
                sub: `${overview?.qc.totalPassed.toLocaleString() ?? 0} units passed`,
                icon: '✅',
                link: ROUTES.QUALITY_CONTROL,
              },
              {
                label: 'Active Employees',
                value: overview?.attendance.activeEmployees ?? 0,
                sub: 'in workforce',
                icon: '👥',
                link: ROUTES.ATTENDANCE,
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Production status breakdown */}
      {overview && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(overview.production.byStatus).map(([status, count]) => (
              <div key={status} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}>
                <span className="text-2xl font-bold">{count}</span>
                <span className="text-sm font-semibold uppercase">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
