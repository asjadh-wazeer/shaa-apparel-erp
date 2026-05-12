import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetAllEmployeesQuery,
  useGetKpiRecordsQuery,
  useUpsertKpiMutation,
  useDeleteKpiMutation,
} from '../../hr/api/hr.api';
import type { KpiRecord } from '../../hr/types/hr.types';

// ── Schema ────────────────────────────────────────────────────────────────────

const kpiSchema = z.object({
  employeeId:      z.string().min(1, 'Employee required'),
  month:           z.coerce.number().min(1).max(12),
  year:            z.coerce.number().min(2000),
  metric:          z.string().min(1, 'Metric required'),
  target:          z.coerce.number().min(0).optional(),
  actual:          z.coerce.number().min(0),
  incentiveAmount: z.coerce.number().min(0).optional(),
  notes:           z.string().optional(),
});
type KpiForm = z.infer<typeof kpiSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COMMON_METRICS = [
  'ORDERS_COMPLETED',
  'QUALITY_RATE',
  'ATTENDANCE_RATE',
  'OUTPUT_UNITS',
  'DEFECT_RATE',
  'ON_TIME_DELIVERY',
  'CYCLE_COMPLETED',
];

const fmt = (n: number | string | undefined) =>
  n !== undefined && n !== null ? Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

const currentMonth = new Date().getMonth() + 1;
const currentYear  = new Date().getFullYear();

// ── KPI Modal ─────────────────────────────────────────────────────────────────

function KpiModal({
  isOpen, onClose, editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing?: KpiRecord;
}): React.JSX.Element {
  const [upsert, { isLoading }] = useUpsertKpiMutation();
  const { data: empData } = useGetAllEmployeesQuery();
  const employees = empData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<KpiForm>({
    resolver: zodResolver(kpiSchema),
    defaultValues: { month: currentMonth, year: currentYear },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editing
        ? {
            employeeId:      editing.employeeId,
            month:           editing.month,
            year:            editing.year,
            metric:          editing.metric,
            target:          editing.target ?? undefined,
            actual:          editing.actual,
            incentiveAmount: editing.incentiveAmount ?? undefined,
            notes:           editing.notes ?? '',
          }
        : { month: currentMonth, year: currentYear, employeeId: '', metric: '', actual: 0 });
    }
  }, [isOpen, editing, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: KpiForm) => {
    await upsert({
      employeeId:      values.employeeId,
      month:           values.month,
      year:            values.year,
      metric:          values.metric,
      target:          values.target,
      actual:          values.actual,
      incentiveAmount: values.incentiveAmount,
      notes:           values.notes,
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? 'Edit KPI Record' : 'Add KPI Record'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Save KPI'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="form-label">Employee <span className="text-red-500">*</span></label>
          <select {...register('employeeId')} className="input w-full" disabled={!!editing}>
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} — {e.jobTitle ?? e.department ?? e.employeeCode}
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="form-error">{errors.employeeId.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Month</label>
            <select {...register('month')} className="input w-full">
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input {...register('year')} type="number" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Metric <span className="text-red-500">*</span></label>
            <input
              {...register('metric')}
              list="metrics-list"
              placeholder="e.g. ORDERS_COMPLETED"
              className="input w-full"
            />
            <datalist id="metrics-list">
              {COMMON_METRICS.map((m) => <option key={m} value={m} />)}
            </datalist>
            {errors.metric && <p className="form-error">{errors.metric.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Target</label>
            <input {...register('target')} type="number" step="0.01" placeholder="10" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Actual <span className="text-red-500">*</span></label>
            <input {...register('actual')} type="number" step="0.01" placeholder="8" className="input w-full" />
            {errors.actual && <p className="form-error">{errors.actual.message}</p>}
          </div>
          <div>
            <label className="form-label">Incentive (LKR)</label>
            <input {...register('incentiveAmount')} type="number" step="0.01" placeholder="0" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

// ── Achievement Bar ───────────────────────────────────────────────────────────

function AchievementBar({ actual, target }: { actual: number; target?: number }): React.JSX.Element {
  if (!target || target === 0) {
    return <span className="text-xs text-gray-400">No target set</span>;
  }
  const pct = Math.min((actual / target) * 100, 100);
  const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="space-y-1 min-w-24">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{actual} / {target}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function KPIIncentivesPage(): React.JSX.Element {
  const [filterMonth,   setFilterMonth]   = useState(currentMonth);
  const [filterYear,    setFilterYear]    = useState(currentYear);
  const [filterEmpId,   setFilterEmpId]   = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [editingRecord, setEditingRecord] = useState<KpiRecord | undefined>();

  const [deleteKpi] = useDeleteKpiMutation();
  const { data: empData } = useGetAllEmployeesQuery();
  const employees = empData?.data ?? [];

  const { data: kpiData, isLoading } = useGetKpiRecordsQuery({
    month:      filterMonth,
    year:       filterYear,
    employeeId: filterEmpId || undefined,
  });
  const records = kpiData?.data ?? [];

  const totalIncentive = records.reduce((s, r) => s + Number(r.incentiveAmount ?? 0), 0);
  const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;
  const metricsHit = records.filter((r) => r.target && Number(r.actual) >= Number(r.target)).length;

  // Group by employee for the summary view
  const byEmployee = records.reduce<Record<string, KpiRecord[]>>((acc, r) => {
    const key = r.employeeId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const handleEdit = (record: KpiRecord) => { setEditingRecord(record); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setEditingRecord(undefined); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI &amp; Incentives</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monthly performance tracking and incentive calculation</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setShowModal(true)}>+ Add KPI Record</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="w-24 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={2020}
          max={2100}
        />
        <select
          value={filterEmpId}
          onChange={(e) => setFilterEmpId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Staff Tracked',   value: isLoading ? '—' : String(uniqueEmployees) },
          { label: 'KPI Records',     value: isLoading ? '—' : String(records.length) },
          { label: 'Targets Hit',     value: isLoading ? '—' : String(metricsHit) },
          { label: 'Total Incentive', value: isLoading ? '—' : `Rs ${fmt(totalIncentive)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            KPI Records — {MONTH_NAMES[filterMonth - 1]} {filterYear}
          </h2>
          {totalIncentive > 0 && (
            <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              Total incentive: Rs {fmt(totalIncentive)}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">No KPI records for this period</p>
            <p className="text-gray-400 text-sm mt-1">Add KPI records to track employee performance and incentives.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowModal(true)}>+ Add KPI Record</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Employee', 'Metric', 'Target', 'Actual', 'Achievement', 'Incentive (LKR)', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const achieved = rec.target ? Number(rec.actual) >= Number(rec.target) : null;
                  return (
                    <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{rec.employee.firstName} {rec.employee.lastName}</p>
                        <p className="text-xs text-gray-400">{rec.employee.jobTitle ?? rec.employee.department ?? rec.employee.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {rec.metric}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rec.target ?? <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{Number(rec.actual)}</td>
                      <td className="px-4 py-3">
                        <AchievementBar actual={Number(rec.actual)} target={rec.target ? Number(rec.target) : undefined} />
                      </td>
                      <td className="px-4 py-3">
                        {rec.incentiveAmount ? (
                          <span className={`font-semibold ${achieved ? 'text-green-600' : 'text-amber-600'}`}>
                            Rs {fmt(rec.incentiveAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(rec)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteKpi(rec.id)}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-employee incentive summary */}
      {Object.keys(byEmployee).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Incentive Summary by Employee</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(byEmployee).map(([, empRecords]) => {
              const emp = empRecords[0].employee;
              const empIncentive = empRecords.reduce((s, r) => s + Number(r.incentiveAmount ?? 0), 0);
              const targetsHit   = empRecords.filter((r) => r.target && Number(r.actual) >= Number(r.target)).length;
              return (
                <div key={emp.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-400">{emp.jobTitle ?? emp.department}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Records</p>
                      <p className="font-bold text-gray-700">{empRecords.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Targets Hit</p>
                      <p className="font-bold text-green-600">{targetsHit}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Incentive</p>
                      <p className={`font-bold ${empIncentive > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {empIncentive > 0 ? `Rs ${fmt(empIncentive)}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <KpiModal isOpen={showModal} onClose={handleClose} editing={editingRecord} />
    </div>
  );
}
