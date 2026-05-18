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

interface AdvanceModalProps {
  batch: ProductionBatch;
  isOpen: boolean;
  onClose: () => void;
}

function AdvanceModal({ batch, isOpen, onClose }: AdvanceModalProps): React.JSX.Element {
  const [advance, { isLoading }] = useAdvanceStageMutation();
  const currentStage = batch.stageHistories?.find((h) => h.status === 'IN_PROGRESS');
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
      title={`Complete: ${currentStage?.stageConfig.name ?? 'Sewing'} — ${batch.batchNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Complete &amp; Advance to QC
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Sewn Qty <span className="text-red-500">*</span></label>
            <input {...register('completedQty')} type="number" min={0} className="input w-full" />
            {errors.completedQty && <p className="form-error">{errors.completedQty.message}</p>}
          </div>
          <div>
            <label className="form-label">Rejected Qty</label>
            <input {...register('rejectedQty')} type="number" min={0} className="input w-full" />
          </div>
        </div>
        <div>
          <label className="form-label">Actual Minutes</label>
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

export function SewingDeptPage(): React.JSX.Element {
  const [advanceBatch, setAdvanceBatch] = useState<ProductionBatch | null>(null);
  const { data, isLoading, isError } = useGetBatchesByStageQuery('SEWING');
  const batches = data?.data ?? [];

  const activeBatches   = batches.filter((b) => b.status !== 'COMPLETED');
  const totalPlannedQty = batches.reduce((s, b) => s + b.plannedQty, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sewing Department</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stage 5 — Sewing operations from verified cutting batches</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400">
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
          <h2 className="font-semibold text-gray-900">Sewing Queue — Verified Batches</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-orange-400 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load sewing batches.</div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No batches are currently at the Sewing stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Batch', 'Order #', 'Description', 'Planned Qty', 'Progress', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const sewingHistory = batch.stageHistories?.find(
                    (h) => h.stageConfig.code === 'SEWING',
                  );
                  const completedQty = sewingHistory?.completedQty ?? 0;
                  const pct = batch.plannedQty > 0
                    ? Math.round((completedQty / batch.plannedQty) * 100)
                    : 0;
                  const isComplete = batch.status === 'COMPLETED';

                  return (
                    <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-gray-700">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-gray-500">
                        {batch.productionOrder?.orderNumber ?? '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800 whitespace-nowrap">
                        {batch.productionOrder?.description ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-gray-700">{batch.plannedQty}</td>
                      <td className="px-4 py-4 min-w-40">
                        {isComplete ? (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600">Complete — In QC</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{completedQty}/{batch.plannedQty} pcs</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: '#F97316' }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {batch.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {!isComplete && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setAdvanceBatch(batch)}
                          >
                            Complete Sewing
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

      {advanceBatch && (
        <AdvanceModal
          batch={advanceBatch}
          isOpen={true}
          onClose={() => setAdvanceBatch(null)}
        />
      )}
    </div>
  );
}
