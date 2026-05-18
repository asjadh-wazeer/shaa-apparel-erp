import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import { useAppSelector } from '../../../store';
import { useGetProductionOrdersQuery } from '../../production/api/production.api';
import {
  useGetDesignSubmissionsQuery,
  useCreateDesignSubmissionMutation,
  useApproveDesignSubmissionMutation,
  useRejectDesignSubmissionMutation,
} from '../api/design.api';

// ── Schema ────────────────────────────────────────────────────────────────────

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28/MB', '30/MB', '32/MB', '34/MB', '36/MB', '38/MB'];

const submitSchema = z.object({
  productionOrderId: z.string().min(1, 'Select a production order'),
  notes: z.string().optional(),
});
type SubmitForm = z.infer<typeof submitSchema>;

const rejectSchema = z.object({ rejectedReason: z.string().min(3, 'Reason is required') });
type RejectForm = z.infer<typeof rejectSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'approved' | 'rejected';
const ADMIN_ROLES = ['TENANT_ADMIN', 'admin', 'ADMIN', 'General Manager', 'CEO & Founder', 'Production Manager', 'PRODUCTION_MANAGER'];

const statusStyle: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// ── Submit Modal ──────────────────────────────────────────────────────────────

function SubmitModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [create, { isLoading }] = useCreateDesignSubmissionMutation();
  const { data: ordersData } = useGetProductionOrdersQuery({ page: 1, limit: 50 });
  const orders = ordersData?.data ?? [];
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeError, setSizeError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
  });

  const toggleSize = (size: string) => {
    setSizeError('');
    setSelectedSizes((prev: string[]) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  };

  const onSubmit = async (values: SubmitForm) => {
    if (selectedSizes.length === 0) { setSizeError('Select at least one size'); return; }
    await create({
      productionOrderId: values.productionOrderId,
      sizes: selectedSizes.join(','),
      notes: values.notes || undefined,
    }).unwrap();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Submit New Design for Review"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            Submit for Review
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="form-label">Production Order <span className="text-red-500">*</span></label>
          <select {...register('productionOrderId')} className="input w-full">
            <option value="">— Select order —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.orderNumber} — {o.description ?? 'Unnamed'}</option>
            ))}
          </select>
          {errors.productionOrderId && <p className="form-error">{errors.productionOrderId.message}</p>}
        </div>
        <div>
          <label className="form-label">Submitted Sizes <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {AVAILABLE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={[
                  'px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors',
                  selectedSizes.includes(size)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400',
                ].join(' ')}
              >
                {size}
              </button>
            ))}
          </div>
          {sizeError && <p className="form-error mt-1">{sizeError}</p>}
        </div>
        <div>
          <label className="form-label">Notes (optional)</label>
          <textarea {...register('notes')} rows={2} className="input w-full" placeholder="Design brief, special requirements…" />
        </div>
      </div>
    </Modal>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ id, onClose }: { id: string; onClose: () => void }): React.JSX.Element {
  const [reject, { isLoading }] = useRejectDesignSubmissionMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
  });

  const onSubmit = async (values: RejectForm) => {
    await reject({ id, rejectedReason: values.rejectedReason }).unwrap();
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Reject Design Submission"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="danger" loading={isLoading} onClick={handleSubmit(onSubmit)}>Reject</Button>
        </>
      }
    >
      <div>
        <label className="form-label">Reason for Rejection <span className="text-red-500">*</span></label>
        <textarea {...register('rejectedReason')} rows={3} className="input w-full" placeholder="Describe why this design is being rejected…" />
        {errors.rejectedReason && <p className="form-error">{errors.rejectedReason.message}</p>}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DesignModulePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = (user?.roles ?? []).some((r) => ADMIN_ROLES.includes(r));

  const [approve, { isLoading: approving }] = useApproveDesignSubmissionMutation();

  const statusFilter = { pending: 'PENDING_APPROVAL', approved: 'APPROVED', rejected: 'REJECTED' }[activeTab];

  const { data, isLoading, isError } = useGetDesignSubmissionsQuery({ status: statusFilter, limit: 50 });
  const submissions = data?.data ?? [];

  // Counts for tab badges
  const { data: pendingData } = useGetDesignSubmissionsQuery({ status: 'PENDING_APPROVAL', limit: 1 });
  const { data: approvedData } = useGetDesignSubmissionsQuery({ status: 'APPROVED', limit: 1 });
  const { data: rejectedData } = useGetDesignSubmissionsQuery({ status: 'REJECTED', limit: 1 });

  const counts: Record<Tab, number> = {
    pending:  pendingData?.meta?.total ?? 0,
    approved: approvedData?.meta?.total ?? 0,
    rejected: rejectedData?.meta?.total ?? 0,
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending',  label: 'Pending Approval' },
    { key: 'approved', label: 'Approved Designs' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Module</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stage 1 — Fashion design review and approval workflow</p>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Submit Design
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
              <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5 bg-gray-100 text-gray-600">
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load design submissions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Review #', 'Production Order', 'Sizes', 'Date Submitted', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                      No designs in this category
                    </td>
                  </tr>
                ) : (
                  submissions.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{row.reviewNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{row.productionOrder?.description ?? 'Unnamed'}</p>
                        <p className="text-xs text-gray-400 font-mono">{row.productionOrder?.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(row.sizes ?? '').split(',').filter(Boolean).map((size) => (
                            <span key={size} className="rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 font-mono">{size.trim()}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(row.submittedAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? ''}`}>
                          {row.status.replace('_', ' ')}
                        </span>
                        {row.rejectedReason && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate" title={row.rejectedReason}>
                            {row.rejectedReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {row.status === 'PENDING_APPROVAL' && isAdmin && (
                            <>
                              <button
                                onClick={() => approve(row.id)}
                                disabled={approving}
                                className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectId(row.id)}
                                className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {row.status === 'PENDING_APPROVAL' && !isAdmin && (
                            <span className="text-xs text-amber-600 font-medium">Awaiting review</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
      {rejectId && <RejectModal id={rejectId} onClose={() => setRejectId(null)} />}
    </div>
  );
}
