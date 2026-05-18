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

function ApproveSampleModal({ batch, isOpen, onClose }: { batch: ProductionBatch; isOpen: boolean; onClose: () => void }): React.JSX.Element {
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
      title={`Approve Sample: ${currentStage?.stageConfig.name ?? 'Sample Making'} — ${batch.batchNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Approve for Production
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 bg-amber-50 rounded-lg px-3 py-2">
          Approving this sample will advance the batch to the Cutting stage and mark it as ready for production.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Samples Completed <span className="text-red-500">*</span></label>
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
          <label className="form-label">Fit Review Notes</label>
          <textarea {...register('notes')} rows={3} className="input w-full" placeholder="Describe fit approval result, adjustments needed, etc." />
        </div>
      </div>
    </Modal>
  );
}

export function SampleMakingPage(): React.JSX.Element {
  const [approveBatch, setApproveBatch] = useState<ProductionBatch | null>(null);
  const { data, isLoading, isError } = useGetBatchesByStageQuery('SAMPLE');
  const batches = data?.data ?? [];

  const activeBatches   = batches.filter((b) => b.status !== 'COMPLETED');
  const completedCount  = batches.filter((b) => b.status === 'COMPLETED').length;
  const totalPlannedQty = batches.reduce((s, b) => s + b.plannedQty, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sample Making</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stage 3 — Physical sample construction, fit review and production approval</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Samples</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : batches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Approved</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-amber-400">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Under Review</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : activeBatches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Planned Qty</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : totalPlannedQty}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sample Records — Fit Review Queue</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load sample batches.</div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No batches are currently at the Sample Making stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Batch', 'Order #', 'Description', 'Planned Qty', 'Progress', 'Fit Approval', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const sampleHistory = batch.stageHistories?.find((h) => h.stageConfig.code === 'SAMPLE');
                  const completedQty = sampleHistory?.completedQty ?? 0;
                  const pct = batch.plannedQty > 0 ? Math.round((completedQty / batch.plannedQty) * 100) : 0;
                  const isComplete = batch.status === 'COMPLETED';

                  return (
                    <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {batch.productionOrder?.orderNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {batch.productionOrder?.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{batch.plannedQty}</td>
                      <td className="px-4 py-3 min-w-40">
                        {isComplete ? (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600">Approved — In Cutting</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{completedQty}/{batch.plannedQty} pcs</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                          {isComplete ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!isComplete && (
                          <Button size="xs" variant="secondary" onClick={() => setApproveBatch(batch)}>
                            Approve Sample
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

      {approveBatch && (
        <ApproveSampleModal
          batch={approveBatch}
          isOpen={true}
          onClose={() => setApproveBatch(null)}
        />
      )}
    </div>
  );
}
