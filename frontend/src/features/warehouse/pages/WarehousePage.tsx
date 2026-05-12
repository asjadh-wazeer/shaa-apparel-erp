import React, { useState } from 'react';
import {
  useGetInventoryItemsQuery,
  useGetLowStockItemsQuery,
  useGetWarehousesQuery,
  useCreateInventoryItemMutation,
  useRecordStockMovementMutation,
} from '../../inventory/api/inventory.api';
import { InventoryItem, InventoryItemType, CreateInventoryItemPayload, CreateStockMovementPayload } from '../../inventory/types/inventory.types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────

type PageTab = 'overview' | 'items' | 'low-stock';
type BinState = 'in-stock' | 'low' | 'allocated' | 'empty';

// ── Static bin map (visual layout until bin-location phase) ───────────────────

const ROWS = ['R1', 'R2', 'R3', 'R4', 'R5'];
const COLS = ['01', '02', '03', '04', '05', '06', '07', '08'];

const binData: Record<string, BinState> = {
  'R1-01': 'in-stock', 'R1-02': 'in-stock', 'R1-03': 'low',       'R1-04': 'in-stock',
  'R1-05': 'in-stock', 'R1-06': 'allocated', 'R1-07': 'in-stock', 'R1-08': 'empty',
  'R2-01': 'in-stock', 'R2-02': 'allocated', 'R2-03': 'in-stock', 'R2-04': 'low',
  'R2-05': 'in-stock', 'R2-06': 'in-stock',  'R2-07': 'empty',    'R2-08': 'in-stock',
  'R3-01': 'low',      'R3-02': 'in-stock',  'R3-03': 'in-stock', 'R3-04': 'allocated',
  'R3-05': 'in-stock', 'R3-06': 'in-stock',  'R3-07': 'in-stock', 'R3-08': 'low',
  'R4-01': 'in-stock', 'R4-02': 'in-stock',  'R4-03': 'empty',    'R4-04': 'in-stock',
  'R4-05': 'allocated','R4-06': 'in-stock',  'R4-07': 'in-stock', 'R4-08': 'in-stock',
  'R5-01': 'empty',    'R5-02': 'in-stock',  'R5-03': 'in-stock', 'R5-04': 'in-stock',
  'R5-05': 'low',      'R5-06': 'in-stock',  'R5-07': 'allocated','R5-08': 'in-stock',
};

const binStateStyle: Record<BinState, { bg: string; label: string }> = {
  'in-stock': { bg: '#22C55E', label: 'In Stock' },
  low:        { bg: '#F59E0B', label: 'Low Stock' },
  allocated:  { bg: '#F97316', label: 'Allocated' },
  empty:      { bg: '#E5E7EB', label: 'Empty' },
};

const ITEM_TYPE_LABELS: Record<InventoryItemType, string> = {
  FABRIC:     'Fabric',
  ACCESSORY:  'Accessory',
  PACKAGING:  'Packaging',
  SPARE_PART: 'Spare Part',
};

const ITEM_TYPE_BADGE: Record<InventoryItemType, string> = {
  FABRIC:     'bg-blue-100 text-blue-700',
  ACCESSORY:  'bg-purple-100 text-purple-700',
  PACKAGING:  'bg-orange-100 text-orange-700',
  SPARE_PART: 'bg-gray-100 text-gray-700',
};

// ── Add Item Modal ─────────────────────────────────────────────────────────────

interface AddItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddItemModal({ onClose, onSuccess }: AddItemModalProps): React.JSX.Element {
  const [createItem, { isLoading }] = useCreateInventoryItemMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateInventoryItemPayload>({
    defaultValues: { type: 'FABRIC', isActive: true, reorderLevel: 0, reorderQuantity: 0, costPerUnit: 0 },
  });

  const onSubmit = async (values: CreateInventoryItemPayload): Promise<void> => {
    try {
      await createItem(values).unwrap();
      toast.success('Inventory item created');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to create item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Add Inventory Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
              <input
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.code ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="FAB-001"
                {...register('code', { required: 'Required' })}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('type', { required: true })}
              >
                {Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Cotton Fabric White"
              {...register('name', { required: 'Required' })}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
              <input
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.unit ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="meters"
                {...register('unit', { required: 'Required' })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cost / Unit</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                {...register('costPerUnit', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50"
                {...register('reorderLevel', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Qty</label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="200"
                {...register('reorderQuantity', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#1D4ED8' }}
            >
              {isLoading ? 'Creating…' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stock Movement Modal ───────────────────────────────────────────────────────

interface MovementModalProps {
  item: InventoryItem;
  warehouseId: string | null;
  onClose: () => void;
}

function StockMovementModal({ item, warehouseId, onClose }: MovementModalProps): React.JSX.Element {
  const [recordMovement, { isLoading }] = useRecordStockMovementMutation();
  const { data: warehouseData } = useGetWarehousesQuery({ limit: 100 });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateStockMovementPayload>({
    defaultValues: {
      type: 'PURCHASE_RECEIVED',
      quantity: 0,
      warehouseId: warehouseId ?? undefined,
    },
  });

  const movementType = watch('type');
  const isOutbound = ['PRODUCTION_ISSUED', 'ADJUSTMENT_OUT', 'TRANSFER_OUT', 'WASTAGE', 'SALE'].includes(movementType);

  const onSubmit = async (values: CreateStockMovementPayload): Promise<void> => {
    try {
      await recordMovement({ itemId: item.id, data: values }).unwrap();
      toast.success('Stock movement recorded');
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to record movement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-gray-900">Record Stock Movement</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.code} — {item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Movement Type *</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('type', { required: true })}
            >
              <optgroup label="Inbound">
                <option value="PURCHASE_RECEIVED">Purchase Received</option>
                <option value="PRODUCTION_RETURNED">Production Returned</option>
                <option value="ADJUSTMENT_IN">Adjustment In</option>
                <option value="OPENING_BALANCE">Opening Balance</option>
                <option value="TRANSFER_IN">Transfer In</option>
              </optgroup>
              <optgroup label="Outbound">
                <option value="PRODUCTION_ISSUED">Production Issued</option>
                <option value="ADJUSTMENT_OUT">Adjustment Out</option>
                <option value="WASTAGE">Wastage</option>
                <option value="SALE">Sale</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quantity ({item.unit}) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.quantity ? 'border-red-400' : 'border-gray-300'}`}
                {...register('quantity', { required: 'Required', valueAsNumber: true, min: { value: 0.001, message: 'Must be > 0' } })}
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={String(item.costPerUnit)}
                {...register('unitCost', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('warehouseId')}
            >
              <option value="">— Select warehouse —</option>
              {warehouseData?.data.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional reference or note"
              {...register('notes')}
            />
          </div>

          {isOutbound && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">
                Outbound movement — stock will be deducted from the selected warehouse.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: isOutbound ? '#DC2626' : '#1D4ED8' }}
            >
              {isLoading ? 'Recording…' : isOutbound ? 'Record Outbound' : 'Record Inbound'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function WarehousePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PageTab>('overview');
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<InventoryItemType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [movementTarget, setMovementTarget] = useState<InventoryItem | null>(null);

  const selectedWarehouseId = null;

  const itemsQuery = useGetInventoryItemsQuery({
    page,
    limit: 15,
    search: search || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
  });

  const lowStockQuery = useGetLowStockItemsQuery();
  const warehouseQuery = useGetWarehousesQuery({ limit: 100, isActive: true });

  const totalItems = itemsQuery.data?.meta.total ?? 0;
  const totalPages = itemsQuery.data?.meta.totalPages ?? 1;
  const lowStockCount = lowStockQuery.data?.data.length ?? 0;
  const warehouseCount = warehouseQuery.data?.data.length ?? 0;

  const tabs: { key: PageTab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Warehouse Overview' },
    { key: 'items', label: 'All Items', badge: totalItems },
    { key: 'low-stock', label: 'Low Stock', badge: lowStockCount },
  ];

  const ITEM_TYPES: { key: InventoryItemType | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'All Types' },
    { key: 'FABRIC', label: 'Fabric' },
    { key: 'ACCESSORY', label: 'Accessory' },
    { key: 'PACKAGING', label: 'Packaging' },
    { key: 'SPARE_PART', label: 'Spare Part' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fabric bins, inventory items and stock management</p>
        </div>
        <button
          onClick={() => setShowAddItem(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#1D4ED8' }}
        >
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Warehouses</p>
          <p className="text-3xl font-bold text-gray-900">
            {warehouseQuery.isLoading ? '…' : warehouseCount}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">
            {itemsQuery.isLoading ? '…' : totalItems}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Warehouses Active</p>
          <p className="text-3xl font-bold text-gray-900">
            {warehouseQuery.isLoading ? '…' : warehouseCount}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Low in Stock</p>
          <p className="text-3xl font-bold text-red-600">
            {lowStockQuery.isLoading ? '…' : lowStockCount}
          </p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
          onClick={() => setActiveTab('low-stock')}
        >
          <span className="text-red-500 font-bold text-base">⚠</span>
          <span className="text-red-700 font-medium">
            {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} at or below reorder level — click to review
          </span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  tab.key === 'low-stock' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Fabric Bin Map</h2>
              <span className="text-xs text-gray-400 italic">Visual layout — bin locations</span>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block">
                <div className="flex gap-2 mb-2 ml-10">
                  {COLS.map((col) => (
                    <div key={col} className="w-10 text-center text-xs font-semibold text-gray-400">{col}</div>
                  ))}
                </div>
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-2 mb-2">
                    <div className="w-8 text-xs font-semibold text-gray-400 text-right">{row}</div>
                    {COLS.map((col) => {
                      const key = `${row}-${col}`;
                      const state = binData[key] ?? 'empty';
                      const isSelected = selectedBin === key;
                      return (
                        <button
                          key={col}
                          onClick={() => setSelectedBin(isSelected ? null : key)}
                          className="w-10 h-10 rounded-md transition-transform hover:scale-110 border-2"
                          style={{
                            backgroundColor: binStateStyle[state].bg,
                            borderColor: isSelected ? '#1D4ED8' : 'transparent',
                          }}
                          title={`${key} — ${binStateStyle[state].label}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {Object.entries(binStateStyle).map(([state, { bg, label }]) => (
                <div key={state} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: bg }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
            {selectedBin && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Bin {selectedBin}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: binStateStyle[binData[selectedBin] ?? 'empty'].bg }}
                  >
                    {binStateStyle[binData[selectedBin] ?? 'empty'].label}
                  </span>
                  <span className="text-sm text-blue-700">
                    {binData[selectedBin] === 'in-stock' && 'Full stock — ready for allocation'}
                    {binData[selectedBin] === 'low' && 'Stock below threshold — reorder recommended'}
                    {binData[selectedBin] === 'allocated' && 'Allocated to active production order'}
                    {binData[selectedBin] === 'empty' && 'No stock in this bin'}
                  </span>
                </div>
              </div>
            )}

            {/* Warehouse list from API */}
            {warehouseQuery.data && warehouseQuery.data.data.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Active Warehouses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {warehouseQuery.data.data.map((wh) => (
                    <div key={wh.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{wh.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{wh.code}{wh.location ? ` · ${wh.location}` : ''}</p>
                        </div>
                        {wh.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Default</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ALL ITEMS ────────────────────────────────────────────────────── */}
        {activeTab === 'items' && (
          <div className="p-5">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, code or barcode…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 flex-wrap">
                {ITEM_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTypeFilter(t.key); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Code', 'Name', 'Type', 'Unit', 'Cost/Unit', 'Reorder Level', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itemsQuery.isLoading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td>
                    </tr>
                  )}
                  {itemsQuery.isError && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-red-500 text-sm">Failed to load inventory items.</td>
                    </tr>
                  )}
                  {!itemsQuery.isLoading && itemsQuery.data?.data.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No items found.</td>
                    </tr>
                  )}
                  {itemsQuery.data?.data.map((item) => {
                    const totalQty = item.warehouseStock?.reduce((s, ws) => s + Number(ws.quantity), 0) ?? 0;
                    const isLow = totalQty <= Number(item.reorderLevel) && Number(item.reorderLevel) > 0;
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ITEM_TYPE_BADGE[item.type]}`}>
                            {ITEM_TYPE_LABELS[item.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-gray-700">
                          Rs {Number(item.costPerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={isLow ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {Number(item.reorderLevel).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700">Low Stock</span>
                          ) : item.isActive ? (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700">OK</span>
                          ) : (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setMovementTarget(item)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            + Movement
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages} · {totalItems} items
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LOW STOCK ────────────────────────────────────────────────────── */}
        {activeTab === 'low-stock' && (
          <div className="p-5">
            {lowStockQuery.isLoading && (
              <p className="text-center text-gray-400 text-sm py-8">Loading…</p>
            )}
            {!lowStockQuery.isLoading && (lowStockQuery.data?.data.length ?? 0) === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-600 font-medium">All stock levels are healthy</p>
                <p className="text-gray-400 text-sm mt-1">No items below reorder level</p>
              </div>
            )}
            {lowStockQuery.data && lowStockQuery.data.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Code', 'Item', 'Type', 'Unit', 'Reorder Level', 'Action'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockQuery.data.data.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ITEM_TYPE_BADGE[item.type]}`}>
                            {ITEM_TYPE_LABELS[item.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3">
                          <span className="text-red-600 font-semibold">
                            {Number(item.reorderLevel).toLocaleString()} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setMovementTarget(item);
                              setActiveTab('items');
                            }}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Record Stock In →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSuccess={() => { /* RTK Query auto-reloads via tag invalidation */ }}
        />
      )}

      {movementTarget && (
        <StockMovementModal
          item={movementTarget}
          warehouseId={selectedWarehouseId}
          onClose={() => setMovementTarget(null)}
        />
      )}
    </div>
  );
}
