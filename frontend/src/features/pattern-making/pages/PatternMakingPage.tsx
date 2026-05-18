import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetBatchesByStageQuery,
  useAdvanceStageMutation,
} from '../../production/api/production.api';
import type { ProductionBatch } from '../../production/types/production.types';

const advanceSchema = z.object({
  completedQty:  z.coerce.number().int().min(0),
  rejectedQty:   z.coerce.number().int().min(0).optional(),
  actualMinutes: z.coerce.number().int().min(0).optional(),
  notes:         z.string().optional(),
});
type AdvanceForm = z.infer<typeof advanceSchema>;

function ApprovePatternModal({ batch, isOpen, onClose }: { batch: ProductionBatch; isOpen: boolean; onClose: () => void }): React.JSX.Element {
  const [advance, { isLoading }] = useAdvanceStageMutation();
  const currentStage = batch.stageHistories.find((h) => h.status === 'IN_PROGRESS');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdvanceForm>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { completedQty: batch.plannedQty, rejectedQty: 0 },
  });

  const onSubmit = async (values: AdvanceForm) => {
    await advance({
      orderId: batch.productionOrderId,
      batchId: batch.id,
      data: {
        completedQty:  values.completedQty,
        rejectedQty:   values.rejectedQty ?? 0,
        actualMinutes: values.actualMinutes,
        notes:         values.notes || undefined,
      },
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Pattern: ${currentStage?.stageConfig.name ?? 'Pattern Making'} — ${batch.batchNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Approve &amp; Advance to Sample
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Patterns Completed <span className="text-red-500">*</span></label>
            <input {...register('completedQty')} type="number" min={0} className="input w-full" />
            {errors.completedQty && <p className="form-error">{errors.completedQty.message}</p>}
          </div>
          <div>
            <label className="form-label">Rejected</label>
            <input {...register('rejectedQty')} type="number" min={0} className="input w-full" />
          </div>
        </div>
        <div>
          <label className="form-label">Time Taken (minutes)</label>
          <input {...register('actualMinutes')} type="number" min={0} className="input w-full" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

const alphabeticSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const numericSizes = ['28', '30', '32', '34', '36', '38', '40'];
const sizeData = [
  { alpha: 'S',   num: '28', chest: '32"', waist: '26"', hip: '35"' },
  { alpha: 'M',   num: '30', chest: '34"', waist: '28"', hip: '37"' },
  { alpha: 'L',   num: '32', chest: '36"', waist: '30"', hip: '39"' },
  { alpha: 'XL',  num: '34', chest: '38"', waist: '32"', hip: '41"' },
  { alpha: '2XL', num: '36', chest: '40"', waist: '34"', hip: '43"' },
  { alpha: '3XL', num: '38', chest: '42"', waist: '36"', hip: '45"' },
];

export function PatternMakingPage(): React.JSX.Element {
  const [approveBatch, setApproveBatch] = useState<ProductionBatch | null>(null);
  const { data, isLoading, isError } = useGetBatchesByStageQuery('PATTERN');
  const batches = data?.data ?? [];

  const activeBatches   = batches.filter((b) => b.status !== 'COMPLETED');
  const totalPlannedQty = batches.reduce((s, b) => s + b.plannedQty, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pattern Making</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stage 2 — Digital/plotter PDS to manual pattern-creation and grading</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Active Batches</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : activeBatches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : batches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Planned Qty</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : totalPlannedQty}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pattern Batches — Awaiting Approval</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load pattern batches.</div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No batches are currently at the Pattern Making stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order #', 'Batch', 'Description', 'Planned Qty', 'Progress', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const patternHistory = batch.stageHistories.find((h) => h.stageConfig.code === 'PATTERN');
                  const completedQty = patternHistory?.completedQty ?? 0;
                  const pct = batch.plannedQty > 0 ? Math.round((completedQty / batch.plannedQty) * 100) : 0;
                  const isComplete = batch.status === 'COMPLETED';

                  return (
                    <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {batch.productionOrder?.orderNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {batch.productionOrder?.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{batch.plannedQty}</td>
                      <td className="px-4 py-3 min-w-36">
                        {isComplete ? (
                          <span className="text-xs font-semibold text-green-600">Approved</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{completedQty}/{batch.plannedQty} pcs</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {batch.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!isComplete && (
                          <Button size="xs" variant="secondary" onClick={() => setApproveBatch(batch)}>
                            Approve Pattern
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Alphabetic Size Reference</h2>
            <p className="text-xs text-gray-500 mt-0.5">S through 4XL grading guide</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-4">
              {alphabeticSizes.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">{s}</span>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Alpha', 'Chest', 'Waist', 'Hip'].map((h) => (
                    <th key={h} className="text-left py-2 text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row) => (
                  <tr key={row.alpha} className="border-b border-gray-50">
                    <td className="py-1.5 font-semibold text-gray-700">{row.alpha}</td>
                    <td className="py-1.5 text-gray-600">{row.chest}</td>
                    <td className="py-1.5 text-gray-600">{row.waist}</td>
                    <td className="py-1.5 text-gray-600">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Numeric Size Reference</h2>
            <p className="text-xs text-gray-500 mt-0.5">28 through 40 grading guide</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-4">
              {numericSizes.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">{s}</span>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Numeric', 'Chest', 'Waist', 'Hip'].map((h) => (
                    <th key={h} className="text-left py-2 text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row) => (
                  <tr key={row.num} className="border-b border-gray-50">
                    <td className="py-1.5 font-semibold text-gray-700">{row.num}</td>
                    <td className="py-1.5 text-gray-600">{row.chest}</td>
                    <td className="py-1.5 text-gray-600">{row.waist}</td>
                    <td className="py-1.5 text-gray-600">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {approveBatch && (
        <ApprovePatternModal
          batch={approveBatch}
          isOpen={true}
          onClose={() => setApproveBatch(null)}
        />
      )}
    </div>
  );
}
