import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetGarmentTypesQuery,
  useGetAllGarmentTypesQuery,
  useGetGarmentTypeQuery,
  useCreateGarmentTypeMutation,
  useUpdateGarmentTypeMutation,
  useDeleteGarmentTypeMutation,
  useAddAccessoryMutation,
  useRemoveAccessoryMutation,
  useGetCostingConfigsQuery,
  useCreateCostingConfigMutation,
  useUpdateCostingConfigMutation,
  useDeleteCostingConfigMutation,
  useGetCalculationsQuery,
  useCreateCalculationMutation,
  useUpdateCalculationMutation,
  useApproveCalculationMutation,
} from '../../costing/api/costing.api';
import { useGetInventoryItemsQuery } from '../../inventory/api/inventory.api';
import { useGetProductionOrdersQuery } from '../../production/api/production.api';
import type {
  GarmentType,
  CostingConfig,
  CostingCalculation,
} from '../../costing/types/costing.types';

// ── Schemas ───────────────────────────────────────────────────────────────────

const garmentTypeSchema = z.object({
  code:        z.string().min(1, 'Code required'),
  name:        z.string().min(2, 'Name required'),
  description: z.string().optional(),
  isActive:    z.boolean().optional(),
});
type GarmentTypeForm = z.infer<typeof garmentTypeSchema>;

const accessorySchema = z.object({
  inventoryItemId: z.string().min(1, 'Item required'),
  quantity:        z.coerce.number().min(0.0001, 'Qty > 0'),
  unit:            z.string().min(1, 'Unit required'),
  notes:           z.string().optional(),
});
type AccessoryForm = z.infer<typeof accessorySchema>;

const configSchema = z.object({
  name:            z.string().min(2, 'Name required'),
  garmentTypeId:   z.string().optional(),
  laborCostPerPcs: z.coerce.number().min(0),
  overheadPercent: z.coerce.number().min(0).max(100),
  profitMarginPct: z.coerce.number().min(0).max(100),
  wastageMinPct:   z.coerce.number().min(0).max(100),
  wastageMaxPct:   z.coerce.number().min(0).max(100),
  isDefault:       z.boolean().optional(),
});
type ConfigForm = z.infer<typeof configSchema>;

const calcSchema = z.object({
  productionOrderId:  z.string().min(1, 'Order required'),
  costingConfigId:    z.string().optional(),
  sellingPricePerPcs: z.coerce.number().min(0).optional(),
  notes:              z.string().optional(),
});
type CalcForm = z.infer<typeof calcSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'sheets' | 'garment-types' | 'configs';

// ── Garment Type Modal ────────────────────────────────────────────────────────

function GarmentTypeModal({
  isOpen, onClose, editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing?: GarmentType;
}): React.JSX.Element {
  const [createType, { isLoading: creating }] = useCreateGarmentTypeMutation();
  const [updateType, { isLoading: updating }] = useUpdateGarmentTypeMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GarmentTypeForm>({
    resolver: zodResolver(garmentTypeSchema),
    defaultValues: { isActive: true },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editing
        ? { code: editing.code, name: editing.name, description: editing.description ?? '', isActive: editing.isActive }
        : { code: '', name: '', description: '', isActive: true });
    }
  }, [isOpen, editing, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: GarmentTypeForm) => {
    if (editing) {
      await updateType({ id: editing.id, data: values }).unwrap();
    } else {
      await createType(values).unwrap();
    }
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? 'Edit Garment Type' : 'Add Garment Type'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Type'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Code <span className="text-red-500">*</span></label>
            <input {...register('code')} placeholder="e.g. BLOUSE" className="input w-full" disabled={!!editing} />
            {errors.code && <p className="form-error">{errors.code.message}</p>}
          </div>
          <div>
            <label className="form-label">Name <span className="text-red-500">*</span></label>
            <input {...register('name')} placeholder="Office Blouse" className="input w-full" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea {...register('description')} rows={2} className="input w-full" />
        </div>
        <div className="flex items-center gap-2">
          <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
    </Modal>
  );
}

// ── Add BOM Item Modal ────────────────────────────────────────────────────────

function AddBomModal({
  isOpen, onClose, garmentTypeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  garmentTypeId: string;
}): React.JSX.Element {
  const [addAccessory, { isLoading }] = useAddAccessoryMutation();
  const { data: invData } = useGetInventoryItemsQuery({ limit: 200 });
  const items = invData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccessoryForm>({
    resolver: zodResolver(accessorySchema),
    defaultValues: { unit: 'pcs' },
  });

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: AccessoryForm) => {
    await addAccessory({
      garmentTypeId,
      data: {
        inventoryItemId: values.inventoryItemId,
        quantity: values.quantity,
        unit: values.unit,
        notes: values.notes,
      },
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add BOM Item"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>Add Item</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="form-label">Inventory Item <span className="text-red-500">*</span></label>
          <select {...register('inventoryItemId')} className="input w-full">
            <option value="">Select item…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.code} — {item.name} ({item.unit})</option>
            ))}
          </select>
          {errors.inventoryItemId && <p className="form-error">{errors.inventoryItemId.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Qty per piece <span className="text-red-500">*</span></label>
            <input {...register('quantity')} type="number" step="0.0001" placeholder="1.2" className="input w-full" />
            {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="form-label">Unit <span className="text-red-500">*</span></label>
            <input {...register('unit')} placeholder="m / pcs / roll" className="input w-full" />
            {errors.unit && <p className="form-error">{errors.unit.message}</p>}
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <input {...register('notes')} placeholder="Optional" className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

// ── Config Modal ──────────────────────────────────────────────────────────────

function ConfigModal({
  isOpen, onClose, editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing?: CostingConfig;
}): React.JSX.Element {
  const [createConfig, { isLoading: creating }] = useCreateCostingConfigMutation();
  const [updateConfig, { isLoading: updating }] = useUpdateCostingConfigMutation();
  const isLoading = creating || updating;
  const { data: gtData } = useGetAllGarmentTypesQuery();
  const garmentTypes = gtData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: { laborCostPerPcs: 0, overheadPercent: 5, profitMarginPct: 30, wastageMinPct: 3, wastageMaxPct: 8 },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editing
        ? {
            name:            editing.name,
            garmentTypeId:   editing.garmentTypeId ?? '',
            laborCostPerPcs: editing.laborCostPerPcs,
            overheadPercent: editing.overheadPercent,
            profitMarginPct: editing.profitMarginPct,
            wastageMinPct:   editing.wastageMinPct,
            wastageMaxPct:   editing.wastageMaxPct,
            isDefault:       editing.isDefault,
          }
        : { name: '', garmentTypeId: '', laborCostPerPcs: 0, overheadPercent: 5, profitMarginPct: 30, wastageMinPct: 3, wastageMaxPct: 8 });
    }
  }, [isOpen, editing, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: ConfigForm) => {
    const payload = {
      name:            values.name,
      garmentTypeId:   values.garmentTypeId || undefined,
      laborCostPerPcs: values.laborCostPerPcs,
      overheadPercent: values.overheadPercent,
      profitMarginPct: values.profitMarginPct,
      wastageMinPct:   values.wastageMinPct,
      wastageMaxPct:   values.wastageMaxPct,
      isDefault:       values.isDefault ?? false,
    };
    if (editing) {
      await updateConfig({ id: editing.id, data: payload }).unwrap();
    } else {
      await createConfig(payload).unwrap();
    }
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? 'Edit Costing Config' : 'Add Costing Config'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Config'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Config Name <span className="text-red-500">*</span></label>
            <input {...register('name')} placeholder="Standard Blouse Config" className="input w-full" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Garment Type (optional)</label>
            <select {...register('garmentTypeId')} className="input w-full">
              <option value="">Global default</option>
              {garmentTypes.map((gt) => (
                <option key={gt.id} value={gt.id}>{gt.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Labour Cost / Piece (LKR)</label>
            <input {...register('laborCostPerPcs')} type="number" step="0.01" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Overhead %</label>
            <input {...register('overheadPercent')} type="number" step="0.1" className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Profit Margin %</label>
            <input {...register('profitMarginPct')} type="number" step="0.1" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Min Wastage %</label>
            <input {...register('wastageMinPct')} type="number" step="0.1" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Max Wastage %</label>
            <input {...register('wastageMaxPct')} type="number" step="0.1" className="input w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input {...register('isDefault')} type="checkbox" id="isDefault" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default config</label>
        </div>
      </div>
    </Modal>
  );
}

// ── New Calculation Modal ─────────────────────────────────────────────────────

function NewCalcModal({
  isOpen, onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const [createCalc, { isLoading }] = useCreateCalculationMutation();
  const { data: ordersData } = useGetProductionOrdersQuery({ limit: 100, status: 'APPROVED' });
  const { data: configsData } = useGetCostingConfigsQuery();
  const orders = ordersData?.data ?? [];
  const configs = configsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CalcForm>({
    resolver: zodResolver(calcSchema),
  });

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: CalcForm) => {
    await createCalc({
      productionOrderId:  values.productionOrderId,
      costingConfigId:    values.costingConfigId || undefined,
      sellingPricePerPcs: values.sellingPricePerPcs || undefined,
      notes:              values.notes,
    }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Cost Calculation"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>Calculate</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="form-label">Production Order <span className="text-red-500">*</span></label>
          <select {...register('productionOrderId')} className="input w-full">
            <option value="">Select order…</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.orderNumber} — {(o as any).garmentType?.name ?? 'No type'} ({o.plannedQty} pcs)</option>
            ))}
          </select>
          {errors.productionOrderId && <p className="form-error">{errors.productionOrderId.message}</p>}
        </div>
        <div>
          <label className="form-label">Costing Config (optional)</label>
          <select {...register('costingConfigId')} className="input w-full">
            <option value="">Auto-select from garment type</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.isDefault ? '(default)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Override Selling Price / Piece (optional)</label>
          <input {...register('sellingPricePerPcs')} type="number" step="0.01" placeholder="Leave blank to auto-calculate from margin" className="input w-full" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

// ── Calculation Detail Row ────────────────────────────────────────────────────

function CalcDetailPanel({ calc }: { calc: CostingCalculation }): React.JSX.Element {
  const [approve, { isLoading }] = useApproveCalculationMutation();
  const [updateCalc, { isLoading: updating }] = useUpdateCalculationMutation();
  const [editPrice, setEditPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(String(Number(calc.sellingPricePerPcs).toFixed(2)));

  const fabricLines = calc.lines.filter((l) => l.lineType === 'FABRIC');
  const otherLines  = calc.lines.filter((l) => l.lineType !== 'FABRIC');
  const margin = calc.totalCost > 0
    ? ((Number(calc.sellingPricePerPcs) - Number(calc.costPerPiece)) / Number(calc.sellingPricePerPcs)) * 100
    : 0;

  return (
    <div className="px-4 py-4 bg-blue-50/40 border-t border-blue-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost breakdown */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Material &amp; Cost Lines</span>
            <span className="text-xs text-gray-400">{calc.lines.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Item', 'Type', 'Qty', 'Unit Cost', 'Wastage %', 'Total'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calc.lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800">{line.inventoryItem.name}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${line.lineType === 'FABRIC' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {line.lineType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{Number(line.quantity).toFixed(3)} {line.inventoryItem.unit}</td>
                    <td className="px-3 py-2 text-gray-700">Rs {fmt(line.unitCost)}</td>
                    <td className="px-3 py-2 text-amber-600">{Number(line.wastagePercent).toFixed(1)}%</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">Rs {fmt(line.totalCost)}</td>
                  </tr>
                ))}
                {calc.lines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 text-xs">No BOM lines — add accessories to the garment type first</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-2 text-sm">
          <h4 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Cost Summary</h4>
          {[
            { label: 'Fabric Cost',     value: Number(calc.totalFabricCost),     color: 'text-purple-700' },
            { label: 'Accessory Cost',  value: Number(calc.totalAccessoryCost),  color: 'text-blue-700' },
            { label: 'Labour Cost',     value: Number(calc.totalLaborCost),      color: 'text-green-700' },
            { label: 'Wastage Cost',    value: Number(calc.totalWastageCost),    color: 'text-amber-700' },
            { label: 'Overhead',        value: Number(calc.overheadCost),        color: 'text-gray-600' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-gray-500">{row.label}</span>
              <span className={`font-medium ${row.color}`}>Rs {fmt(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Total Cost</span>
            <span>Rs {fmt(calc.totalCost)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Cost / Piece</span>
            <span>Rs {fmt(calc.costPerPiece)}</span>
          </div>

          <div className="border-t border-gray-100 pt-2 space-y-1">
            {editPrice ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="input flex-1 text-xs"
                />
                <button
                  onClick={async () => {
                    await updateCalc({ id: calc.id, data: { sellingPricePerPcs: parseFloat(newPrice) } });
                    setEditPrice(false);
                  }}
                  disabled={updating}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
                >
                  Save
                </button>
                <button onClick={() => setEditPrice(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-700">Selling Price / Pc</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900">Rs {fmt(calc.sellingPricePerPcs)}</span>
                  {!calc.isApproved && (
                    <button onClick={() => setEditPrice(true)} className="text-xs text-gray-400 hover:text-blue-600">✎</button>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Gross Margin</span>
              <span className={`font-semibold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>

          {!calc.isApproved && (
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-2"
              loading={isLoading}
              onClick={() => approve(calc.id)}
            >
              Approve Calculation
            </Button>
          )}
          {calc.isApproved && (
            <div className="text-center text-xs text-green-600 font-semibold pt-1">
              APPROVED {calc.approvedAt ? `· ${new Date(calc.approvedAt).toLocaleDateString()}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BOM View (inside garment types tab) ──────────────────────────────────────

function GarmentTypeBomView({ typeId }: { typeId: string }): React.JSX.Element {
  const { data, isLoading } = useGetGarmentTypeQuery(typeId);
  const [removeAccessory] = useRemoveAccessoryMutation();
  const [showAddBom, setShowAddBom] = useState(false);
  const type = data?.data;

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bill of Materials</span>
        <button onClick={() => setShowAddBom(true)} className="text-xs text-blue-600 hover:underline font-medium">+ Add Item</button>
      </div>
      {isLoading ? (
        <div className="text-xs text-gray-400 py-2">Loading…</div>
      ) : !type?.garmentAccessories?.length ? (
        <p className="text-xs text-gray-400 py-2">No BOM items yet. Add fabric and accessories.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 uppercase tracking-wide">
              {['Item', 'Type', 'Qty / Piece', 'Unit Cost', 'Cost / Piece', ''].map((h) => (
                <th key={h} className="pb-1 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {type.garmentAccessories!.map((acc) => {
              const costPerPiece = Number(acc.quantity) * Number(acc.inventoryItem.costPerUnit ?? 0);
              return (
                <tr key={acc.id} className="border-t border-gray-100">
                  <td className="py-1.5 pr-4 font-medium text-gray-800">{acc.inventoryItem.name}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${acc.inventoryItem.type === 'FABRIC' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                      {acc.inventoryItem.type ?? 'ACCESSORY'}
                    </span>
                  </td>
                  <td className="py-1.5 pr-4 text-gray-600">{Number(acc.quantity).toFixed(4)} {acc.unit}</td>
                  <td className="py-1.5 pr-4 text-gray-500">Rs {fmt(acc.inventoryItem.costPerUnit ?? 0)}</td>
                  <td className="py-1.5 pr-4 text-gray-800 font-medium">Rs {fmt(costPerPiece)}</td>
                  <td className="py-1.5">
                    <button
                      onClick={() => removeAccessory({ garmentTypeId: typeId, accessoryId: acc.id })}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {showAddBom && (
        <AddBomModal isOpen={showAddBom} onClose={() => setShowAddBom(false)} garmentTypeId={typeId} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function CostCalculationPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('sheets');
  const [calcPage,  setCalcPage]  = useState(1);
  const [gtPage,    setGtPage]    = useState(1);
  const [expandedCalc, setExpandedCalc] = useState<string | null>(null);
  const [expandedGt,   setExpandedGt]   = useState<string | null>(null);
  const [showNewCalc,  setShowNewCalc]  = useState(false);
  const [showNewType,  setShowNewType]  = useState(false);
  const [editingType,  setEditingType]  = useState<GarmentType | undefined>();
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CostingConfig | undefined>();

  const { data: calcData, isLoading: calcsLoading } = useGetCalculationsQuery({ page: calcPage, limit: 10 });
  const calcs = calcData?.data ?? [];
  const calcMeta = calcData?.meta;

  const { data: gtData, isLoading: gtLoading } = useGetGarmentTypesQuery({ page: gtPage, limit: 15 });
  const garmentTypes = gtData?.data ?? [];
  const gtMeta = gtData?.meta;

  const { data: configData, isLoading: configsLoading } = useGetCostingConfigsQuery();
  const configs = configData?.data ?? [];

  const [deleteType]   = useDeleteGarmentTypeMutation();
  const [deleteConfig] = useDeleteCostingConfigMutation();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sheets',        label: 'Cost Sheets' },
    { id: 'garment-types', label: 'Garment Types & BOM' },
    { id: 'configs',       label: 'Costing Configs' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Calculation</h1>
          <p className="text-sm text-gray-500 mt-0.5">BOM-based costing engine — fabric, accessories, labour &amp; overhead</p>
        </div>
        {activeTab === 'sheets'        && <Button variant="primary" onClick={() => setShowNewCalc(true)}>+ New Cost Sheet</Button>}
        {activeTab === 'garment-types' && <Button variant="primary" onClick={() => setShowNewType(true)}>+ Add Garment Type</Button>}
        {activeTab === 'configs'       && <Button variant="primary" onClick={() => setShowNewConfig(true)}>+ Add Config</Button>}
      </div>

      {/* Stats */}
      {activeTab === 'sheets' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Sheets',   value: calcsLoading ? '—' : String(calcMeta?.total ?? calcs.length) },
            { label: 'Approved',       value: calcsLoading ? '—' : String(calcs.filter((c) => c.isApproved).length) },
            { label: 'Pending Review', value: calcsLoading ? '—' : String(calcs.filter((c) => !c.isApproved).length) },
            { label: 'Avg Cost / Pc',  value: calcsLoading ? '—' : calcs.length ? `Rs ${fmt(calcs.reduce((s, c) => s + Number(c.costPerPiece), 0) / calcs.length)}` : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Cost Sheets ──────────────────────────────────────────────── */}
      {activeTab === 'sheets' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {calcsLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : calcs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No cost sheets yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a costing config and garment type BOM, then calculate.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowNewCalc(true)}>+ New Cost Sheet</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Order', 'Garment Type', 'Qty', 'Total Cost', 'Cost / Pc', 'Selling / Pc', 'Margin', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calcs.map((calc) => {
                    const margin = calc.totalCost > 0
                      ? ((Number(calc.sellingPricePerPcs) - Number(calc.costPerPiece)) / Number(calc.sellingPricePerPcs)) * 100
                      : 0;
                    const expanded = expandedCalc === calc.id;
                    return (
                      <React.Fragment key={calc.id}>
                        <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {calc.productionOrder?.orderNumber ?? calc.productionOrderId.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                            {calc.productionOrder?.garmentType?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{calc.productionOrder?.plannedQty ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">Rs {fmt(calc.totalCost)}</td>
                          <td className="px-4 py-3 text-gray-700">Rs {fmt(calc.costPerPiece)}</td>
                          <td className="px-4 py-3 text-blue-700 font-semibold">Rs {fmt(calc.sellingPricePerPcs)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold text-xs ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${calc.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {calc.isApproved ? 'APPROVED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedCalc(expanded ? null : calc.id)}
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              {expanded ? 'Collapse' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`${calc.id}-detail`}>
                            <td colSpan={9} className="p-0">
                              <CalcDetailPanel calc={calc} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Garment Types ─────────────────────────────────────────────── */}
      {activeTab === 'garment-types' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {gtLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : garmentTypes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No garment types yet</p>
              <p className="text-gray-400 text-sm mt-1">Add garment types and their BOM to enable auto-costing.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowNewType(true)}>+ Add Garment Type</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Code', 'Name', 'BOM Items', 'Used in Orders', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {garmentTypes.map((gt) => {
                    const expanded = expandedGt === gt.id;
                    return (
                      <React.Fragment key={gt.id}>
                        <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${expanded ? 'bg-gray-50' : ''}`}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{gt.code}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{gt.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700">
                              {gt._count?.garmentAccessories ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700">
                              {gt._count?.productionOrders ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${gt.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {gt.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedGt(expanded ? null : gt.id)}
                                className="text-xs text-blue-600 hover:underline font-medium"
                              >
                                {expanded ? 'Collapse' : 'BOM'}
                              </button>
                              <button
                                onClick={() => { setEditingType(gt); setShowNewType(true); }}
                                className="text-xs text-blue-600 hover:underline font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteType(gt.id)}
                                className="text-xs text-red-500 hover:underline font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`${gt.id}-bom`}>
                            <td colSpan={6} className="p-0">
                              <GarmentTypeBomView typeId={gt.id} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {gtMeta && gtMeta.totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-600 border-t border-gray-100">
              <span>Showing {(gtPage - 1) * (gtMeta.limit) + 1}–{Math.min(gtPage * gtMeta.limit, gtMeta.total)} of {gtMeta.total}</span>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="secondary" disabled={!gtMeta.hasPreviousPage} onClick={() => setGtPage((p) => p - 1)}>Prev</Button>
                <span>{gtPage} / {gtMeta.totalPages}</span>
                <Button size="xs" variant="secondary" disabled={!gtMeta.hasNextPage} onClick={() => setGtPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Configs ────────────────────────────────────────────────────── */}
      {activeTab === 'configs' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {configsLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : configs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No costing configs yet</p>
              <p className="text-gray-400 text-sm mt-1">A config defines labour cost, overhead %, wastage range, and profit margin.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowNewConfig(true)}>+ Add Config</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Name', 'Garment Type', 'Labour / Pc', 'Overhead', 'Wastage Range', 'Margin', 'Default', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{cfg.name}</td>
                      <td className="px-4 py-3 text-gray-500">{cfg.garmentType?.name ?? <span className="text-gray-400 italic">Global</span>}</td>
                      <td className="px-4 py-3 text-gray-700">Rs {fmt(cfg.laborCostPerPcs)}</td>
                      <td className="px-4 py-3 text-gray-600">{Number(cfg.overheadPercent).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-amber-600">{Number(cfg.wastageMinPct).toFixed(1)}–{Number(cfg.wastageMaxPct).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{Number(cfg.profitMarginPct).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center">
                        {cfg.isDefault && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">DEFAULT</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingConfig(cfg); setShowNewConfig(true); }}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteConfig(cfg.id)}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination for cost sheets */}
      {activeTab === 'sheets' && calcMeta && calcMeta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {(calcPage - 1) * calcMeta.limit + 1}–{Math.min(calcPage * calcMeta.limit, calcMeta.total)} of {calcMeta.total}</span>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="secondary" disabled={!calcMeta.hasPreviousPage} onClick={() => setCalcPage((p) => p - 1)}>Previous</Button>
            <span className="px-2">{calcPage} / {calcMeta.totalPages}</span>
            <Button size="xs" variant="secondary" disabled={!calcMeta.hasNextPage} onClick={() => setCalcPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewCalc && (
        <NewCalcModal isOpen={showNewCalc} onClose={() => setShowNewCalc(false)} />
      )}
      <GarmentTypeModal
        isOpen={showNewType}
        onClose={() => { setShowNewType(false); setEditingType(undefined); }}
        editing={editingType}
      />
      <ConfigModal
        isOpen={showNewConfig}
        onClose={() => { setShowNewConfig(false); setEditingConfig(undefined); }}
        editing={editingConfig}
      />
    </div>
  );
}
