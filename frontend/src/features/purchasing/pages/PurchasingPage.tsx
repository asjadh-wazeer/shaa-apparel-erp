import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetPoStatsQuery,
  useGetPurchaseOrdersQuery,
  useGetAllSuppliersQuery,
  useCreatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCreateGrnMutation,
  useConfirmGrnMutation,
} from '../api/purchasing.api';
import { useGetInventoryItemsQuery } from '../../inventory/api/inventory.api';
import { useGetWarehousesQuery } from '../../inventory/api/inventory.api';
import type { PurchaseOrder, GoodsReceivedNote } from '../types/purchasing.types';

const STATUS_BADGE: Record<string, string> = {
  DRAFT:               'bg-gray-100 text-gray-600',
  SUBMITTED:           'bg-blue-100 text-blue-700',
  APPROVED:            'bg-purple-100 text-purple-700',
  PARTIALLY_RECEIVED:  'bg-amber-100 text-amber-700',
  FULLY_RECEIVED:      'bg-green-100 text-green-700',
  CANCELLED:           'bg-red-100 text-red-500',
};

// ── Create PO Modal ────────────────────────────────────────────────────────────

const poItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Select an item'),
  orderedQty:      z.coerce.number().min(0.001, 'Must be > 0'),
  unitPrice:       z.coerce.number().min(0, 'Must be ≥ 0'),
  notes:           z.string().optional(),
});

const createPoSchema = z.object({
  supplierId:   z.string().min(1, 'Select a supplier'),
  orderDate:    z.string().min(1, 'Order date is required'),
  expectedDate: z.string().optional(),
  notes:        z.string().optional(),
  items:        z.array(poItemSchema).min(1, 'Add at least one item'),
});

type CreatePoForm = z.infer<typeof createPoSchema>;

function CreatePoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [createPo, { isLoading }] = useCreatePurchaseOrderMutation();
  const { data: suppliersData } = useGetAllSuppliersQuery();
  const { data: itemsData }     = useGetInventoryItemsQuery({ limit: 200, isActive: true });
  const suppliers  = suppliersData?.data ?? [];
  const invItems   = itemsData?.data ?? [];

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<CreatePoForm>({
    resolver: zodResolver(createPoSchema),
    defaultValues: {
      orderDate: new Date().toISOString().slice(0, 10),
      items: [{ inventoryItemId: '', orderedQty: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const totalValue = watchedItems.reduce((s, i) => s + (Number(i.orderedQty) || 0) * (Number(i.unitPrice) || 0), 0);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: CreatePoForm) => {
    await createPo({
      supplierId:   values.supplierId,
      orderDate:    values.orderDate,
      expectedDate: values.expectedDate || undefined,
      notes:        values.notes || undefined,
      items: values.items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        orderedQty:      Number(i.orderedQty),
        unitPrice:       Number(i.unitPrice),
        notes:           i.notes || undefined,
      })),
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Purchase Order"
      size="2xl"
      footer={
        <>
          <span className="mr-auto text-sm text-gray-500 font-medium">
            Total: <span className="text-gray-900 font-bold">{totalValue.toLocaleString()}</span>
          </span>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>Create PO</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Supplier <span className="text-red-500">*</span></label>
            <select {...register('supplierId')} className="input w-full">
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
            {errors.supplierId && <p className="form-error">{errors.supplierId.message}</p>}
          </div>
          <div>
            <label className="form-label">Order Date <span className="text-red-500">*</span></label>
            <input {...register('orderDate')} type="date" className="input w-full" />
            {errors.orderDate && <p className="form-error">{errors.orderDate.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Expected Delivery</label>
            <input {...register('expectedDate')} type="date" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input {...register('notes')} placeholder="Optional notes" className="input w-full" />
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">Line Items <span className="text-red-500">*</span></label>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => append({ inventoryItemId: '', orderedQty: 1, unitPrice: 0 })}
            >
              + Add Line
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-3">
                <div className="col-span-5">
                  <select {...register(`items.${idx}.inventoryItemId`)} className="input w-full text-xs">
                    <option value="">Select item…</option>
                    {invItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code}) — {item.unit}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[idx]?.inventoryItemId && (
                    <p className="form-error text-xs">{errors.items[idx]?.inventoryItemId?.message}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`items.${idx}.orderedQty`)}
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="Qty"
                    className="input w-full text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    {...register(`items.${idx}.unitPrice`)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Unit price"
                    className="input w-full text-xs"
                  />
                </div>
                <div className="col-span-1 text-right text-xs text-gray-500 pt-2">
                  {((Number(watchedItems[idx]?.orderedQty) || 0) * (Number(watchedItems[idx]?.unitPrice) || 0)).toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-400 hover:text-red-600 pt-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.items?.root && <p className="form-error">{errors.items.root.message}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ── GRN Modal ──────────────────────────────────────────────────────────────────

const grnItemSchema = z.object({
  inventoryItemId: z.string(),
  receivedQty:     z.coerce.number().min(0),
  acceptedQty:     z.coerce.number().min(0),
  rejectedQty:     z.coerce.number().min(0).optional(),
  unitCost:        z.coerce.number().min(0),
  notes:           z.string().optional(),
});

const grnSchema = z.object({
  warehouseId:  z.string().min(1, 'Select a warehouse'),
  receivedDate: z.string().optional(),
  notes:        z.string().optional(),
  items:        z.array(grnItemSchema),
});

type GrnForm = z.infer<typeof grnSchema>;

function CreateGrnModal({ po, isOpen, onClose }: { po: PurchaseOrder; isOpen: boolean; onClose: () => void }) {
  const [createGrn, { isLoading }] = useCreateGrnMutation();
  const { data: warehousesData } = useGetWarehousesQuery({ limit: 100, isActive: true });
  const warehouses = warehousesData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GrnForm>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      receivedDate: new Date().toISOString().slice(0, 10),
      items: po.items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        receivedQty:     Number(item.orderedQty) - Number(item.receivedQty),
        acceptedQty:     Number(item.orderedQty) - Number(item.receivedQty),
        rejectedQty:     0,
        unitCost:        Number(item.unitPrice),
      })),
    },
  });

  const onSubmit = async (values: GrnForm) => {
    await createGrn({
      poId: po.id,
      data: {
        warehouseId:  values.warehouseId,
        receivedDate: values.receivedDate || undefined,
        notes:        values.notes || undefined,
        items: values.items
          .filter((i) => i.receivedQty > 0)
          .map((i) => ({
            inventoryItemId: i.inventoryItemId,
            receivedQty:     Number(i.receivedQty),
            acceptedQty:     Number(i.acceptedQty),
            rejectedQty:     Number(i.rejectedQty ?? 0),
            unitCost:        Number(i.unitCost),
            notes:           i.notes || undefined,
          })),
      },
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create GRN — ${po.poNumber}`}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>Create GRN</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Warehouse <span className="text-red-500">*</span></label>
            <select {...register('warehouseId')} className="input w-full">
              <option value="">Select warehouse…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
            {errors.warehouseId && <p className="form-error">{errors.warehouseId.message}</p>}
          </div>
          <div>
            <label className="form-label">Received Date</label>
            <input {...register('receivedDate')} type="date" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <input {...register('notes')} placeholder="Optional notes" className="input w-full" />
        </div>

        <div>
          <label className="form-label mb-2">Items Received</label>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Item', 'Received Qty', 'Accepted Qty', 'Rejected Qty', 'Unit Cost'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {po.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      {item.inventoryItem.name}
                      <span className="text-gray-400 ml-1">({item.inventoryItem.unit})</span>
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${idx}.receivedQty`)} type="number" min="0" step="0.001" className="input w-24 text-xs" />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${idx}.acceptedQty`)} type="number" min="0" step="0.001" className="input w-24 text-xs" />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${idx}.rejectedQty`)} type="number" min="0" step="0.001" className="input w-24 text-xs" />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${idx}.unitCost`)} type="number" min="0" step="0.01" className="input w-28 text-xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── PO Detail Panel ────────────────────────────────────────────────────────────

function PoDetailPanel({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [submit,  { isLoading: submitting }]  = useSubmitPurchaseOrderMutation();
  const [approve, { isLoading: approving }]   = useApprovePurchaseOrderMutation();
  const [confirm, { isLoading: confirming }]  = useConfirmGrnMutation();
  const [cancel,  { isLoading: cancelling }]  = useCancelPurchaseOrderMutation();

  const canGrn     = ['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status);
  const canSubmit  = po.status === 'DRAFT';
  const canApprove = po.status === 'SUBMITTED';
  const canCancel  = !['FULLY_RECEIVED', 'CANCELLED'].includes(po.status);
  const draftGrns  = po.grns?.filter((g) => g.status === 'DRAFT') ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-blue-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-blue-50">
        <div>
          <span className="font-semibold text-gray-900">{po.poNumber}</span>
          <span className="ml-2 text-sm text-gray-500">{po.supplier.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit  && <Button size="xs" variant="secondary" loading={submitting}  onClick={() => submit(po.id)}>Submit</Button>}
          {canApprove && <Button size="xs" variant="primary"   loading={approving}   onClick={() => approve(po.id)}>Approve</Button>}
          {canGrn     && <Button size="xs" variant="primary"   onClick={() => setShowGrnModal(true)}>+ Receive Stock</Button>}
          {canCancel  && <Button size="xs" variant="danger"    loading={cancelling}  onClick={() => { cancel(po.id); onClose(); }}>Cancel</Button>}
          <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Line Items</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {['Item', 'Ordered', 'Received', 'Unit Price', 'Total'].map((h) => (
                <th key={h} className="text-left pb-2 text-gray-400 font-medium whitespace-nowrap pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                  {item.inventoryItem.name}
                  <span className="text-gray-400 ml-1 font-normal">({item.inventoryItem.unit})</span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{Number(item.orderedQty)}</td>
                <td className="py-2 pr-4">
                  <span className={Number(item.receivedQty) >= Number(item.orderedQty) ? 'text-green-600 font-semibold' : 'text-amber-600'}>
                    {Number(item.receivedQty)}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{Number(item.unitPrice).toLocaleString()}</td>
                <td className="py-2 font-semibold text-gray-800">{Number(item.totalPrice).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GRNs */}
      {draftGrns.length > 0 && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pending GRNs</p>
          <div className="space-y-2">
            {draftGrns.map((grn) => (
              <div key={grn.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                <div className="text-xs">
                  <span className="font-semibold text-gray-700">{grn.grnNumber}</span>
                  <span className="text-gray-500 ml-2">{grn.items.length} items</span>
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  loading={confirming}
                  onClick={() => confirm({ poId: po.id, grnId: grn.id })}
                >
                  Confirm &amp; Update Stock
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGrnModal && (
        <CreateGrnModal po={po} isOpen={true} onClose={() => setShowGrnModal(false)} />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PurchasingPage(): React.JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPo, setExpandedPo]           = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page,   setPage]     = useState(1);

  const { data: statsData } = useGetPoStatsQuery();
  const { data, isLoading, isError } = useGetPurchaseOrdersQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });

  const stats  = statsData?.data;
  const orders = data?.data ?? [];
  const meta   = data?.meta;

  const statCards = [
    { label: 'Draft',       value: stats?.draft             ?? 0, color: 'border-gray-300' },
    { label: 'Submitted',   value: stats?.submitted         ?? 0, color: 'border-blue-400' },
    { label: 'Approved',    value: stats?.approved          ?? 0, color: 'border-purple-400' },
    { label: 'Part. Rcvd',  value: stats?.partiallyReceived ?? 0, color: 'border-amber-400' },
    { label: 'Fully Rcvd',  value: stats?.fullyReceived     ?? 0, color: 'border-green-500' },
    { label: 'Total POs',   value: stats?.total             ?? 0, color: 'border-indigo-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchasing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Purchase orders for fabric, accessories and materials</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>+ New Purchase Order</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
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
            placeholder="Search PO number or supplier…"
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
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="FULLY_RECEIVED">Fully Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* PO List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center text-sm">
          Failed to load purchase orders.
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No purchase orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first PO to start ordering materials.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>+ New Purchase Order</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['PO #', 'Supplier', 'Items', 'Total', 'Order Date', 'Expected', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <React.Fragment key={po.id}>
                    <tr
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedPo(expandedPo === po.id ? null : po.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{po.poNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{po.supplier.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{po.items.length} line{po.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {Number(po.totalAmount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{po.orderDate.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{po.expectedDate?.slice(0, 10) ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[po.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        <svg className={`w-4 h-4 transition-transform ${expandedPo === po.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {expandedPo === po.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50">
                          <PoDetailPanel po={po} onClose={() => setExpandedPo(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}</span>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="secondary" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="px-2">{page} / {meta.totalPages}</span>
            <Button size="xs" variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <CreatePoModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
