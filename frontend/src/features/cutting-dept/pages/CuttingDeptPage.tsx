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
      title={`Complete: ${currentStage?.stageConfig.name ?? 'Cutting'} — ${batch.batchNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Complete &amp; Advance
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Cut Qty <span className="text-red-500">*</span></label>
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

export function CuttingDeptPage(): React.JSX.Element {
  const [advanceBatch, setAdvanceBatch] = useState<ProductionBatch | null>(null);
  const { data, isLoading, isError } = useGetBatchesByStageQuery('CUTTING');
  const batches = data?.data ?? [];

  const activeBatches  = batches.filter((b) => b.status !== 'COMPLETED');
  const totalPlannedQty = batches.reduce((s, b) => s + b.plannedQty, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cutting Department</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stage 4 — Fabric cutting operations and batch management</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Active Batches</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : activeBatches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : batches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Planned Qty</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : totalPlannedQty}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide self-center">Traffic Light:</p>
        {[
          { color: 'bg-green-500', label: 'GREEN — Qty Matches' },
          { color: 'bg-yellow-400', label: 'YELLOW — Excess Qty' },
          { color: 'bg-red-500',   label: 'RED — Shortage' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${s.color} inline-block`} />
            <span className="text-xs text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cutting Batches</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load cutting batches.</div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No batches are currently at the Cutting stage.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order #', 'Batch', 'Description', 'Planned Qty', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const cuttingHistory = batch.stageHistories.find(
                    (h) => h.stageConfig.code === 'CUTTING',
                  );
                  const completedQty = cuttingHistory?.completedQty ?? 0;
                  const pct = batch.plannedQty > 0
                    ? Math.round((completedQty / batch.plannedQty) * 100)
                    : 0;

                  return (
                    <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {batch.productionOrder?.orderNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {batch.productionOrder?.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="space-y-1 min-w-32">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{completedQty}/{batch.plannedQty}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: '#22C55E' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          batch.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {batch.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {batch.status !== 'COMPLETED' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setAdvanceBatch(batch)}
                          >
                            Complete Cutting
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
