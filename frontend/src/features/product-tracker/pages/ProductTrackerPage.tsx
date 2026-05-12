import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import { Input } from '../../../shared/components/ui/Input/Input';
import {
  useGetProductionStatsQuery,
  useGetProductionOrdersQuery,
  useCreateProductionOrderMutation,
  useCreateProductionBatchMutation,
  useAdvanceStageMutation,
} from '../../production/api/production.api';
import type {
  ProductionOrder,
  ProductionBatch,
  StageHistory,
  CreateProductionOrderPayload,
} from '../../production/types/production.types';

const STAGE_COLORS: Record<string, string> = {
  DESIGN:    '#3B82F6',
  PATTERN:   '#8B5CF6',
  SAMPLE:    '#14B8A6',
  CUTTING:   '#22C55E',
  SEWING:    '#F97316',
  QC:        '#6366F1',
  FINISHING: '#EC4899',
};

const ORDER_STATUS_BADGE: Record<string, string> = {
  DRAFT:               'bg-gray-100 text-gray-700',
  PLANNED:             'bg-blue-100 text-blue-700',
  IN_PROGRESS:         'bg-amber-100 text-amber-700',
  PARTIALLY_COMPLETED: 'bg-purple-100 text-purple-700',
  COMPLETED:           'bg-green-100 text-green-700',
  ON_HOLD:             'bg-red-100 text-red-700',
  CANCELLED:           'bg-gray-100 text-gray-500',
};

const createOrderSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  plannedQty:  z.coerce.number().int().min(1, 'Must be at least 1'),
  priority:    z.coerce.number().int().min(1).max(10).optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate:   z.string().optional(),
  notes: z.string().optional(),
});

const batchSchema = z.object({
  plannedQty: z.coerce.number().int().min(1, 'Must be at least 1'),
  notes:      z.string().optional(),
});

const advanceSchema = z.object({
  completedQty:  z.coerce.number().int().min(0, 'Must be 0 or more'),
  rejectedQty:   z.coerce.number().int().min(0).optional(),
  actualMinutes: z.coerce.number().int().min(0).optional(),
  notes:         z.string().optional(),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;
type BatchForm      = z.infer<typeof batchSchema>;
type AdvanceForm    = z.infer<typeof advanceSchema>;

function computeProgress(stageHistories: StageHistory[]): number {
  if (!stageHistories.length) return 0;
  const completed = stageHistories.filter((h) => h.status === 'COMPLETED').length;
  return Math.round((completed / stageHistories.length) * 100);
}

function getCurrentStageName(batch: ProductionBatch): string {
  const current = batch.stageHistories.find((h) => h.status === 'IN_PROGRESS');
  return current?.stageConfig.name ?? (batch.status === 'COMPLETED' ? 'Done' : 'Pending');
}

interface StagePipelineProps {
  stageHistories: StageHistory[];
}

function StagePipeline({ stageHistories }: StagePipelineProps): React.JSX.Element {
  const sorted = [...stageHistories].sort(
    (a, b) => a.stageConfig.orderIndex - b.stageConfig.orderIndex,
  );
  return (
    <div className="flex items-center gap-1">
      {sorted.map((h, idx) => {
        const color = STAGE_COLORS[h.stageConfig.code] ?? '#6B7280';
        const isCompleted = h.status === 'COMPLETED';
        const isCurrent   = h.status === 'IN_PROGRESS';
        return (
          <React.Fragment key={h.id}>
            {idx > 0 && (
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: isCompleted ? color : '#E5E7EB' }}
              />
            )}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  backgroundColor: isCompleted ? color : isCurrent ? color + '22' : '#F9FAFB',
                  borderColor: isCompleted || isCurrent ? color : '#D1D5DB',
                  color: isCompleted ? '#fff' : isCurrent ? color : '#9CA3AF',
                }}
                title={h.stageConfig.name}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  h.stageConfig.code.slice(0, 2)
                )}
              </div>
              <span className="text-gray-400" style={{ fontSize: '9px', lineHeight: '1' }}>
                {h.stageConfig.name.split(' ')[0]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps): React.JSX.Element {
  const [createOrder, { isLoading }] = useCreateProductionOrderMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { priority: 5 },
  });

  const onSubmit = async (values: CreateOrderForm) => {
    const payload: CreateProductionOrderPayload = {
      description:      values.description,
      plannedQty:       values.plannedQty,
      priority:         values.priority,
      plannedStartDate: values.plannedStartDate || undefined,
      plannedEndDate:   values.plannedEndDate || undefined,
      notes:            values.notes || undefined,
    };
    await createOrder(payload).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Production Order"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Create Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="form-label">Description <span className="text-red-500">*</span></label>
          <input
            {...register('description')}
            placeholder="e.g. Office Blouse Ivory — SS26"
            className="input w-full"
          />
          {errors.description && <p className="form-error">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Planned Qty <span className="text-red-500">*</span></label>
            <input {...register('plannedQty')} type="number" min={1} className="input w-full" />
            {errors.plannedQty && <p className="form-error">{errors.plannedQty.message}</p>}
          </div>
          <div>
            <label className="form-label">Priority (1=high, 10=low)</label>
            <input {...register('priority')} type="number" min={1} max={10} className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Planned Start</label>
            <input {...register('plannedStartDate')} type="date" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Planned End</label>
            <input {...register('plannedEndDate')} type="date" className="input w-full" />
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

interface StartBatchModalProps {
  order: ProductionOrder;
  isOpen: boolean;
  onClose: () => void;
}

function StartBatchModal({ order, isOpen, onClose }: StartBatchModalProps): React.JSX.Element {
  const [createBatch, { isLoading }] = useCreateProductionBatchMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: { plannedQty: order.plannedQty },
  });

  const onSubmit = async (values: BatchForm) => {
    await createBatch({ orderId: order.id, data: { plannedQty: values.plannedQty, notes: values.notes || undefined } }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Start Batch — ${order.orderNumber}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Start Batch
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          This will create a batch and start the production workflow from the first stage (Design).
        </p>
        <div>
          <label className="form-label">Planned Qty <span className="text-red-500">*</span></label>
          <input {...register('plannedQty')} type="number" min={1} className="input w-full" />
          {errors.plannedQty && <p className="form-error">{errors.plannedQty.message}</p>}
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

interface AdvanceStageModalProps {
  order: ProductionOrder;
  batch: ProductionBatch;
  isOpen: boolean;
  onClose: () => void;
}

function AdvanceStageModal({ order, batch, isOpen, onClose }: AdvanceStageModalProps): React.JSX.Element {
  const [advanceStage, { isLoading }] = useAdvanceStageMutation();
  const currentStage = batch.stageHistories.find((h) => h.status === 'IN_PROGRESS');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdvanceForm>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { completedQty: batch.plannedQty, rejectedQty: 0 },
  });

  const onSubmit = async (values: AdvanceForm) => {
    await advanceStage({
      orderId: order.id,
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
      title={`Complete Stage: ${currentStage?.stageConfig.name ?? '—'}`}
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
            <label className="form-label">Completed Qty <span className="text-red-500">*</span></label>
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

interface OrderCardProps {
  order: ProductionOrder;
}

function OrderCard({ order }: OrderCardProps): React.JSX.Element {
  const [showBatchModal, setShowBatchModal]     = useState(false);
  const [advanceBatch, setAdvanceBatch]         = useState<ProductionBatch | null>(null);

  const activeBatches = order.batches.filter((b) => b.status !== 'CANCELLED');
  const hasBatch      = activeBatches.length > 0;
  const firstBatch    = activeBatches[0];

  const stageHistories = firstBatch?.stageHistories ?? [];
  const progress       = hasBatch ? computeProgress(stageHistories) : 0;
  const currentStage   = hasBatch ? getCurrentStageName(firstBatch) : null;
  const canAdvance     = firstBatch?.status === 'IN_PROGRESS' || firstBatch?.status === 'OPEN';

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-100">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {order.status.replace(/_/g, ' ')}
          </span>
          <span className="font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
          {order.description && (
            <span className="text-sm text-gray-600">{order.description}</span>
          )}
          {currentStage && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: STAGE_COLORS[firstBatch?.stageHistories.find((h) => h.status === 'IN_PROGRESS')?.stageConfig.code ?? ''] ?? '#6B7280' }}
            >
              {currentStage}
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            Priority: {order.priority} · Qty: {order.plannedQty}
          </span>
        </div>

        <div className="px-5 py-4">
          {hasBatch ? (
            <>
              <StagePipeline stageHistories={stageHistories} />
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {firstBatch.batchNumber}
                    {activeBatches.length > 1 && ` +${activeBatches.length - 1} more`}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #F59E0B, #F97316)' }}
                  />
                </div>
              </div>
              {canAdvance && (
                <div className="mt-3 flex justify-end">
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => setAdvanceBatch(firstBatch)}
                  >
                    Advance Stage
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400 italic">No batch started yet</span>
              <Button size="xs" variant="primary" onClick={() => setShowBatchModal(true)}>
                Start Batch
              </Button>
            </div>
          )}
        </div>
      </div>

      <StartBatchModal
        order={order}
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
      />
      {advanceBatch && (
        <AdvanceStageModal
          order={order}
          batch={advanceBatch}
          isOpen={true}
          onClose={() => setAdvanceBatch(null)}
        />
      )}
    </>
  );
}

export function ProductTrackerPage(): React.JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);

  const { data: statsData } = useGetProductionStatsQuery();
  const { data, isLoading, isError } = useGetProductionOrdersQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });

  const stats = statsData?.data;
  const orders = data?.data ?? [];
  const meta   = data?.meta;

  const statCards = [
    { label: 'Total Orders',  value: stats?.total      ?? 0, color: '#6366F1' },
    { label: 'In Progress',   value: stats?.inProgress ?? 0, color: '#F59E0B' },
    { label: 'Completed',     value: stats?.completed  ?? 0, color: '#22C55E' },
    { label: 'Draft',         value: stats?.draft      ?? 0, color: '#94A3B8' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Tracking</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            End-to-end production workflow — from design to finishing
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: s.color }}
            >
              {s.value}
            </div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search orders…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PARTIALLY_COMPLETED">Partially Completed</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center text-sm">
          Failed to load production orders. Check your connection and try again.
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 font-medium">No production orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first order to start the production workflow.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
            + New Order
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {(page - 1) * (meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="secondary"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2">{page} / {meta.totalPages}</span>
            <Button
              size="xs"
              variant="secondary"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CreateOrderModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
