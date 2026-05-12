import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetQcStatsQuery,
  useGetQualityChecksQuery,
  useCreateQualityCheckMutation,
  useApproveQualityCheckMutation,
  useDeleteQualityCheckMutation,
  useUpdateReworkMutation,
} from '../api/qc.api';
import type { QualityCheck, DefectSeverity, ReworkRecord, ReworkStatus } from '../types/qc.types';
import { useGetProductionOrdersQuery } from '../../production/api/production.api';

// ── Constants ─────────────────────────────────────────────────────────────────

const RESULT_OPTIONS = ['PASSED', 'FAILED', 'CONDITIONAL_PASS'] as const;
const SEVERITY_OPTIONS: DefectSeverity[] = ['MINOR', 'MAJOR', 'CRITICAL'];

const COMMON_DEFECTS = [
  'STITCHING_OFF',
  'MEASUREMENT_OFF',
  'COLOUR_INCONSISTENCY',
  'FABRIC_FLAW',
  'BUTTON_MISALIGNMENT',
  'UNEVEN_HEM',
  'ZIPPER_DEFECT',
  'SEAM_FAILURE',
];

const resultStyle: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CONDITIONAL_PASS: 'bg-amber-100 text-amber-700',
};

const severityStyle: Record<DefectSeverity, string> = {
  MINOR: 'bg-yellow-100 text-yellow-700',
  MAJOR: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const reworkStatusStyle: Record<ReworkStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// ── Zod schemas ───────────────────────────────────────────────────────────────

const defectSchema = z.object({
  defectCode: z.string().min(1, 'Required'),
  defectName: z.string().min(1, 'Required'),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
  quantity: z.coerce.number().int().min(1),
  description: z.string().optional(),
});

const checkSchema = z.object({
  productionOrderId: z.string().min(1, 'Production order is required'),
  checkNumber: z.string().min(1, 'Check number is required'),
  result: z.enum(['PASSED', 'FAILED', 'CONDITIONAL_PASS']),
  inspectedQty: z.coerce.number().int().min(0),
  passedQty: z.coerce.number().int().min(0),
  failedQty: z.coerce.number().int().min(0),
  reworkQty: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  defects: z.array(defectSchema).optional(),
});

type CheckForm = z.infer<typeof checkSchema>;

// ── QC Check Modal ────────────────────────────────────────────────────────────

interface QcCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function QcCheckModal({ isOpen, onClose }: QcCheckModalProps): React.JSX.Element {
  const [createCheck, { isLoading }] = useCreateQualityCheckMutation();
  const { data: ordersData } = useGetProductionOrdersQuery({ limit: 100 });
  const orders = ordersData?.data ?? [];

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<CheckForm>({
    resolver: zodResolver(checkSchema),
    defaultValues: {
      result: 'PASSED',
      inspectedQty: 0,
      passedQty: 0,
      failedQty: 0,
      reworkQty: 0,
      defects: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'defects' });
  const result = watch('result');

  const onSubmit = async (values: CheckForm) => {
    await createCheck(values).unwrap();
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New QC Inspection"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Save Inspection
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Production Order <span className="text-red-500">*</span></label>
            <select {...register('productionOrderId')} className="input w-full">
              <option value="">— Select order —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.orderNumber} — {o.description}</option>
              ))}
            </select>
            {errors.productionOrderId && <p className="form-error">{errors.productionOrderId.message}</p>}
          </div>
          <div>
            <label className="form-label">Check Number <span className="text-red-500">*</span></label>
            <input {...register('checkNumber')} className="input w-full" placeholder="QC-2026-001" />
            {errors.checkNumber && <p className="form-error">{errors.checkNumber.message}</p>}
          </div>
          <div>
            <label className="form-label">Result <span className="text-red-500">*</span></label>
            <select {...register('result')} className="input w-full">
              {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Inspected Qty</label>
            <input {...register('inspectedQty')} type="number" min={0} className="input w-full" />
          </div>
          <div>
            <label className="form-label">Passed Qty</label>
            <input {...register('passedQty')} type="number" min={0} className="input w-full" />
          </div>
          <div>
            <label className="form-label">Failed Qty</label>
            <input {...register('failedQty')} type="number" min={0} className="input w-full" />
          </div>
          <div>
            <label className="form-label">Rework Qty</label>
            <input {...register('reworkQty')} type="number" min={0} className="input w-full" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <textarea {...register('notes')} rows={2} className="input w-full" placeholder="Inspector observations..." />
          </div>
        </div>

        {/* Defects section — only relevant for FAILED or CONDITIONAL_PASS */}
        {result !== 'PASSED' && (
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Defect Records</p>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => append({ defectCode: '', defectName: '', severity: 'MINOR', quantity: 1 })}
              >
                + Add Defect
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No defects recorded yet.</p>
            )}
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <input
                    {...register(`defects.${idx}.defectCode`)}
                    list="defect-codes"
                    className="input w-full text-xs"
                    placeholder="Code"
                  />
                  <datalist id="defect-codes">
                    {COMMON_DEFECTS.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div className="col-span-3">
                  <input
                    {...register(`defects.${idx}.defectName`)}
                    className="input w-full text-xs"
                    placeholder="Name"
                  />
                </div>
                <div className="col-span-2">
                  <select {...register(`defects.${idx}.severity`)} className="input w-full text-xs">
                    {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`defects.${idx}.quantity`)}
                    type="number"
                    min={1}
                    className="input w-full text-xs"
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Check Detail Panel ────────────────────────────────────────────────────────

interface CheckDetailPanelProps {
  check: QualityCheck;
  onClose: () => void;
}

function CheckDetailPanel({ check, onClose }: CheckDetailPanelProps): React.JSX.Element {
  const [approve, { isLoading: approving }] = useApproveQualityCheckMutation();
  const [updateRework, { isLoading: updatingRework }] = useUpdateReworkMutation();

  const passRate = check.inspectedQty > 0
    ? ((check.passedQty / check.inspectedQty) * 100).toFixed(1)
    : '0';

  const handleApprove = async () => {
    await approve(check.id).unwrap();
  };

  const handleReworkStatus = async (rework: ReworkRecord, status: ReworkStatus) => {
    await updateRework({ checkId: check.id, reworkId: rework.id, data: { status } }).unwrap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Inspection #{check.checkNumber}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Order: {check.productionOrder?.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Inspected', value: check.inspectedQty, color: 'text-gray-900' },
              { label: 'Passed', value: check.passedQty, color: 'text-green-600' },
              { label: 'Failed', value: check.failedQty, color: 'text-red-600' },
              { label: 'Pass Rate', value: `${passRate}%`, color: parseFloat(passRate) >= 95 ? 'text-green-600' : 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Result + approval */}
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${resultStyle[check.result]}`}>
              {check.result.replace('_', ' ')}
            </span>
            {!check.approvedAt ? (
              <Button size="sm" variant="primary" loading={approving} onClick={handleApprove}>
                Approve Inspection
              </Button>
            ) : (
              <span className="text-xs text-green-600 font-medium">
                Approved {new Date(check.approvedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {check.notes && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">{check.notes}</div>
          )}

          {/* Defects */}
          {check.defects.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Defects ({check.defects.length})</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Code</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Severity</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {check.defects.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-mono text-gray-600">{d.defectCode}</td>
                        <td className="px-3 py-2 text-gray-700">{d.defectName}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${severityStyle[d.severity]}`}>
                            {d.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700">{d.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reworks */}
          {check.reworks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Rework Records ({check.reworks.length})</h3>
              <div className="space-y-2">
                {check.reworks.map((rw) => (
                  <div key={rw.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{rw.reworkType}</p>
                      <p className="text-xs text-gray-500">Qty: {rw.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${reworkStatusStyle[rw.status]}`}>
                        {rw.status.replace('_', ' ')}
                      </span>
                      {rw.status === 'PENDING' && (
                        <button
                          onClick={() => handleReworkStatus(rw, 'IN_PROGRESS')}
                          disabled={updatingRework}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Start
                        </button>
                      )}
                      {rw.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleReworkStatus(rw, 'COMPLETED')}
                          disabled={updatingRework}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function QualityControlPage(): React.JSX.Element {
  const [tab, setTab] = useState<'inspections' | 'defects'>('inspections');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: statsData } = useGetQcStatsQuery();
  const stats = statsData?.data;

  const { data, isLoading, isError } = useGetQualityChecksQuery({
    ...(orderFilter && { productionOrderId: orderFilter }),
    ...(resultFilter && { result: resultFilter as any }),
    page,
    limit: 20,
  });

  const [deleteCheck] = useDeleteQualityCheckMutation();
  const checks = data?.data ?? [];
  const meta = data?.meta;

  const defectTotals = checks.reduce(
    (acc, c) => {
      c.defects.forEach((d) => {
        acc[d.severity] = (acc[d.severity] ?? 0) + d.quantity;
      });
      return acc;
    },
    {} as Record<DefectSeverity, number>,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-sm text-gray-500 mt-0.5">Inspections, defect tracking and rework management</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Inspection</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Checks', value: stats?.totalChecks ?? 0, color: 'border-indigo-500' },
          { label: 'Passed', value: stats?.passed ?? 0, color: 'border-green-500' },
          { label: 'Failed', value: stats?.failed ?? 0, color: 'border-red-500' },
          { label: 'Units Inspected', value: stats?.totalInspected ?? 0, color: 'border-blue-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Defect severity summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {((['MINOR', 'MAJOR', 'CRITICAL'] as DefectSeverity[])).map((sev) => (
            <div key={sev} className={`rounded-xl p-4 flex items-center gap-3 ${
              sev === 'MINOR' ? 'bg-yellow-50 border border-yellow-200' :
              sev === 'MAJOR' ? 'bg-orange-50 border border-orange-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                sev === 'MINOR' ? 'bg-yellow-100 text-yellow-700' :
                sev === 'MAJOR' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {(stats.defectsBySeverity?.[sev] ?? 0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{sev}</p>
                <p className="text-xs text-gray-400">defect units</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        {(['inspections', 'defects'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'inspections' ? 'QC Inspections' : 'Defect Analysis'}
          </button>
        ))}
      </div>

      {/* Inspections Tab */}
      {tab === 'inspections' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 flex gap-3">
            <select
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
              className="input text-sm"
            >
              <option value="">All Results</option>
              {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-sm text-red-500">Failed to load inspections.</div>
          ) : checks.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No QC inspections found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Check #', 'Order', 'Result', 'Inspected', 'Passed', 'Failed', 'Defects', 'Date', 'Approved', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checks.map((check) => {
                    const passRate = check.inspectedQty > 0
                      ? ((check.passedQty / check.inspectedQty) * 100).toFixed(0)
                      : '0';
                    return (
                      <tr key={check.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                          {check.checkNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {check.productionOrder?.orderNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultStyle[check.result]}`}>
                            {check.result.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{check.inspectedQty}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{check.passedQty}</td>
                        <td className="px-4 py-3">
                          {check.failedQty > 0 ? (
                            <span className="text-red-600 font-medium">{check.failedQty}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {check.defects.length > 0 ? (
                            <span className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
                              {check.defects.length} types
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(check.inspectedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {check.approvedAt ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Button size="xs" variant="secondary" onClick={() => setSelectedCheck(check)}>
                              View
                            </Button>
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => deleteCheck(check.id)}
                            >
                              Del
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {meta.total} inspections &bull; Page {meta.page} of {meta.totalPages}
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
      )}

      {/* Defect Analysis Tab */}
      {tab === 'defects' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Defect Breakdown — Current Page</h2>
          </div>
          {checks.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No defect data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Check #', 'Order', 'Defect Code', 'Defect Name', 'Severity', 'Quantity', 'Description'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checks.flatMap((check) =>
                    check.defects.map((d) => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{check.checkNumber}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{check.productionOrder?.orderNumber ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{d.defectCode}</td>
                        <td className="px-4 py-3 text-gray-800">{d.defectName}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyle[d.severity]}`}>
                            {d.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{d.quantity}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{d.description ?? '—'}</td>
                      </tr>
                    )),
                  )}
                  {checks.every((c) => c.defects.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                        No defects recorded for the current inspections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <QcCheckModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      {selectedCheck && (
        <CheckDetailPanel check={selectedCheck} onClose={() => setSelectedCheck(null)} />
      )}
    </div>
  );
}
