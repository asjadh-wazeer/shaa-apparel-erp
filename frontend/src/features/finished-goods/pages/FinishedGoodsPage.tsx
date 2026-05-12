import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetFinishedGoodsStatsQuery,
  useGetFinishedGoodsQuery,
  useCreateFinishedGoodMutation,
  useUpdateFinishedGoodMutation,
  useDeleteFinishedGoodMutation,
  useAdjustFinishedGoodStockMutation,
} from '../api/finished-goods.api';
import type { FinishedGood, StockAdjustmentType } from '../types/finished-goods.types';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const goodSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  unitCost: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});
type GoodForm = z.infer<typeof goodSchema>;

const adjustSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional(),
});
type AdjustForm = z.infer<typeof adjustSchema>;

// ── Finished Good Modal ───────────────────────────────────────────────────────

interface GoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: FinishedGood;
}

function GoodModal({ isOpen, onClose, editItem }: GoodModalProps): React.JSX.Element {
  const [create, { isLoading: creating }] = useCreateFinishedGoodMutation();
  const [update, { isLoading: updating }] = useUpdateFinishedGoodMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoodForm>({
    resolver: zodResolver(goodSchema),
    defaultValues: { quantity: 0, unitCost: 0, sellingPrice: 0, isActive: true },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editItem
        ? {
            sku: editItem.sku,
            name: editItem.name,
            description: editItem.description ?? '',
            category: editItem.category ?? '',
            color: editItem.color ?? '',
            size: editItem.size ?? '',
            quantity: editItem.quantity,
            unitCost: editItem.unitCost,
            sellingPrice: editItem.sellingPrice,
            isActive: editItem.isActive,
          }
        : { sku: '', name: '', description: '', category: '', color: '', size: '', quantity: 0, unitCost: 0, sellingPrice: 0, isActive: true });
    }
  }, [isOpen, editItem, reset]);

  const onSubmit = async (values: GoodForm) => {
    if (editItem) {
      await update({ id: editItem.id, data: values }).unwrap();
    } else {
      await create(values).unwrap();
    }
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editItem ? 'Edit Finished Good' : 'Add Finished Good'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">SKU <span className="text-red-500">*</span></label>
          <input {...register('sku')} className="input w-full" placeholder="FG-2026-001" />
          {errors.sku && <p className="form-error">{errors.sku.message}</p>}
        </div>
        <div>
          <label className="form-label">Name <span className="text-red-500">*</span></label>
          <input {...register('name')} className="input w-full" placeholder="Office Blouse Ivory" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="form-label">Description</label>
          <textarea {...register('description')} rows={2} className="input w-full" />
        </div>
        <div>
          <label className="form-label">Category</label>
          <input {...register('category')} className="input w-full" placeholder="Blouse, Frock…" />
        </div>
        <div>
          <label className="form-label">Color</label>
          <input {...register('color')} className="input w-full" placeholder="Ivory, Navy…" />
        </div>
        <div>
          <label className="form-label">Size</label>
          <input {...register('size')} className="input w-full" placeholder="S, M, L, XL…" />
        </div>
        <div>
          <label className="form-label">Initial Quantity</label>
          <input {...register('quantity')} type="number" min={0} className="input w-full" />
        </div>
        <div>
          <label className="form-label">Unit Cost (LKR)</label>
          <input {...register('unitCost')} type="number" min={0} step="0.01" className="input w-full" />
        </div>
        <div>
          <label className="form-label">Selling Price (LKR)</label>
          <input {...register('sellingPrice')} type="number" min={0} step="0.01" className="input w-full" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4 rounded" />
          <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active</label>
        </div>
      </div>
    </Modal>
  );
}

// ── Adjust Stock Modal ────────────────────────────────────────────────────────

interface AdjustStockModalProps {
  item: FinishedGood;
  isOpen: boolean;
  onClose: () => void;
}

function AdjustStockModal({ item, isOpen, onClose }: AdjustStockModalProps): React.JSX.Element {
  const [adjust, { isLoading }] = useAdjustFinishedGoodStockMutation();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AdjustForm>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 'OUT', quantity: 1 },
  });

  const type = watch('type') as StockAdjustmentType;

  const onSubmit = async (values: AdjustForm) => {
    await adjust({ id: item.id, data: values }).unwrap();
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Adjust Stock — ${item.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button
            variant={type === 'OUT' ? 'danger' : 'primary'}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {type === 'IN' ? 'Add Stock' : 'Dispatch / Remove'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Current Stock</span>
            <span className="font-bold text-gray-900">{item.quantity} units</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-500">SKU</span>
            <span className="font-mono text-xs text-gray-600">{item.sku}</span>
          </div>
        </div>

        <div>
          <label className="form-label">Adjustment Type</label>
          <div className="flex gap-3 mt-1">
            {(['IN', 'OUT'] as StockAdjustmentType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={t}
                  {...register('type')}
                  className="w-4 h-4"
                />
                <span className={`text-sm font-semibold ${t === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                  {t === 'IN' ? 'Stock In' : 'Stock Out / Dispatch'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Quantity <span className="text-red-500">*</span></label>
          <input {...register('quantity')} type="number" min={1} className="input w-full" />
          {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="form-label">Reason</label>
          <input {...register('reason')} className="input w-full" placeholder="Dispatch to retailer, production return…" />
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function FinishedGoodsPage(): React.JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<FinishedGood | undefined>();
  const [adjustItem, setAdjustItem] = useState<FinishedGood | undefined>();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: statsData } = useGetFinishedGoodsStatsQuery();
  const stats = statsData?.data;

  const { data, isLoading, isError } = useGetFinishedGoodsQuery({
    ...(search && { search }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(activeFilter !== '' && { isActive: activeFilter === 'true' }),
    page,
    limit: 20,
  });

  const [deleteGood] = useDeleteFinishedGoodMutation();

  const goods = data?.data ?? [];
  const meta = data?.meta;

  const handleEdit = (item: FinishedGood) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditItem(undefined);
  };

  const marginPct = (item: FinishedGood) => {
    if (!item.sellingPrice || item.sellingPrice === 0) return null;
    return (((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100).toFixed(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finished Goods</h1>
          <p className="text-sm text-gray-500 mt-0.5">QC-cleared inventory ready for dispatch and sales</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Item</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total SKUs', value: stats?.totalSkus ?? 0, color: 'border-indigo-500' },
          { label: 'Active SKUs', value: stats?.activeSkus ?? 0, color: 'border-green-500' },
          { label: 'Units in Stock', value: stats?.totalUnitsInStock ?? 0, color: 'border-blue-500' },
          { label: 'Ready to Dispatch', value: stats?.readyToDispatch ?? 0, color: 'border-teal-500' },
          {
            label: 'Avg Selling Price',
            value: stats?.avgSellingPrice
              ? `LKR ${Number(stats.avgSellingPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : '—',
            color: 'border-purple-500',
          },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search SKU or name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input text-sm w-56"
        />
        <input
          type="text"
          placeholder="Filter by category…"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input text-sm w-44"
        />
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="input text-sm"
        >
          <option value="">All Items</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load finished goods.</div>
        ) : goods.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No finished goods found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['SKU', 'Name', 'Category', 'Color / Size', 'Stock', 'Unit Cost', 'Selling Price', 'Margin', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goods.map((item) => {
                  const margin = marginPct(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{item.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap max-w-[180px] truncate">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.category ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {[item.color, item.size].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${item.quantity === 0 ? 'text-red-500' : item.quantity < 20 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {item.unitCost > 0 ? `LKR ${Number(item.unitCost).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium text-xs">
                        {item.sellingPrice > 0 ? `LKR ${Number(item.sellingPrice).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {margin !== null ? (
                          <span className={`font-semibold ${parseFloat(margin) >= 30 ? 'text-green-600' : parseFloat(margin) >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                            {margin}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button size="xs" variant="secondary" onClick={() => setAdjustItem(item)}>
                            Stock
                          </Button>
                          <Button size="xs" variant="secondary" onClick={() => handleEdit(item)}>
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => deleteGood(item.id)}
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
              {meta.total} items &bull; Page {meta.page} of {meta.totalPages}
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

      {/* Modals */}
      <GoodModal isOpen={modalOpen} onClose={handleModalClose} editItem={editItem} />
      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          isOpen={true}
          onClose={() => setAdjustItem(undefined)}
        />
      )}
    </div>
  );
}
