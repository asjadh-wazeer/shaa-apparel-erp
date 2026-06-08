import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/components/ui/Button/Button';
import { Modal } from '../../../shared/components/modal/Modal';
import {
  useGetSalesStatsQuery,
  useGetCatalogQuery,
  useGetPosConfigQuery,
  useUpsertPosConfigMutation,
  useGetSalesQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useTriggerSyncMutation,
  useGetSyncStatusQuery,
  useGetSyncLogsQuery,
} from '../api/pos.api';
import type { SaleRecord, SaleChannel, SaleStatus, CartItem, CatalogItem, SyncStatus } from '../types/pos.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANNELS: SaleChannel[] = ['POS', 'ONLINE', 'WHOLESALE', 'DIRECT'];
const STATUSES: SaleStatus[] = ['COMPLETED', 'INVOICED', 'REFUNDED', 'CANCELLED'];

const CHANNEL_STYLE: Record<SaleChannel, string> = {
  POS: 'bg-blue-100 text-blue-700',
  ONLINE: 'bg-purple-100 text-purple-700',
  WHOLESALE: 'bg-green-100 text-green-700',
  DIRECT: 'bg-orange-100 text-orange-700',
};

const STATUS_STYLE: Record<SaleStatus, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-blue-100 text-blue-700',
  REFUNDED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const fmt = (n: number) =>
  `LKR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Schemas ───────────────────────────────────────────────────────────────────

const configSchema = z.object({
  posSystemName: z.string().min(1, 'Required'),
  apiEndpoint: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  apiKey: z.string().optional(),
  syncIntervalMin: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});
type ConfigForm = z.infer<typeof configSchema>;

const updateSaleSchema = z.object({
  status: z.enum(['COMPLETED', 'INVOICED', 'REFUNDED', 'CANCELLED']),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});
type UpdateSaleForm = z.infer<typeof updateSaleSchema>;

// ── Update Sale Modal ─────────────────────────────────────────────────────────

function UpdateSaleModal({ sale, isOpen, onClose }: { sale: SaleRecord; isOpen: boolean; onClose: () => void }): React.JSX.Element {
  const [update, { isLoading }] = useUpdateSaleMutation();
  const { register, handleSubmit, reset } = useForm<UpdateSaleForm>({
    resolver: zodResolver(updateSaleSchema),
    defaultValues: { status: sale.status, customerName: sale.customerName ?? '', notes: sale.notes ?? '' },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({ status: sale.status, customerName: sale.customerName ?? '', notes: sale.notes ?? '' });
    }
  }, [isOpen, sale, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: UpdateSaleForm) => {
    await update({ id: sale.id, data: values }).unwrap();
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit Sale — ${sale.saleNumber}`} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>Save</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Status</label>
          <select {...register('status')} className="input w-full">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Customer Name</label>
          <input {...register('customerName')} className="input w-full" placeholder="Walk-in" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input w-full" />
        </div>
      </div>
    </Modal>
  );
}

// ── Sales Records Tab ─────────────────────────────────────────────────────────

function SalesTab(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<SaleChannel | ''>('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [editSale, setEditSale] = useState<SaleRecord | null>(null);

  const { data, isLoading, isError } = useGetSalesQuery({
    ...(channelFilter && { channel: channelFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(search && { search }),
    page,
    limit: 20,
  });

  const [deleteSale] = useDeleteSaleMutation();
  const sales = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search sale #, customer, product…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input text-sm w-56"
        />
        <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value as SaleChannel | ''); setPage(1); }} className="input text-sm">
          <option value="">All Channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as SaleStatus | ''); setPage(1); }} className="input text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input text-sm" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input text-sm" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-sm text-red-500">Failed to load sales.</div>
      ) : sales.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">No sales found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Sale #', 'Product', 'Qty', 'Unit Price', 'Total', 'Customer', 'Channel', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{sale.saleNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap max-w-[160px] truncate">
                    {sale.finishedGood.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{sale.quantity}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmt(Number(sale.unitPrice))}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(Number(sale.totalAmount))}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{sale.customerName ?? 'Walk-in'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHANNEL_STYLE[sale.channel]}`}>
                      {sale.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[sale.status]}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button size="xs" variant="secondary" onClick={() => setEditSale(sale)}>Edit</Button>
                      <Button size="xs" variant="danger" onClick={() => deleteSale(sale.id)}>Del</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">{meta.total} sales &bull; Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages}>Next</Button>
          </div>
        </div>
      )}

      {editSale && <UpdateSaleModal sale={editSale} isOpen onClose={() => setEditSale(null)} />}
    </div>
  );
}

// ── POS Terminal Tab ──────────────────────────────────────────────────────────

function PosTerminalTab(): React.JSX.Element {
  const { data: catalogData, isLoading: catalogLoading } = useGetCatalogQuery();
  const [createSale, { isLoading: submitting }] = useCreateSaleMutation();

  const catalog = catalogData?.data ?? [];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<SaleChannel>('POS');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredCatalog = useMemo(() =>
    searchCatalog
      ? catalog.filter((i) =>
          i.name.toLowerCase().includes(searchCatalog.toLowerCase()) ||
          i.sku.toLowerCase().includes(searchCatalog.toLowerCase()),
        )
      : catalog,
    [catalog, searchCatalog],
  );

  const cartTotal = cart.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.catalogItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.catalogItem.id === item.id
            ? { ...c, quantity: Math.min(c.quantity + 1, item.quantity) }
            : c,
        );
      }
      return [...prev, { catalogItem: item, quantity: 1, unitPrice: Number(item.sellingPrice) }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.catalogItem.id !== id));
    } else {
      setCart((prev) =>
        prev.map((c) =>
          c.catalogItem.id === id
            ? { ...c, quantity: Math.min(qty, c.catalogItem.quantity) }
            : c,
        ),
      );
    }
  };

  const updatePrice = (id: string, price: number) => {
    setCart((prev) =>
      prev.map((c) => (c.catalogItem.id === id ? { ...c, unitPrice: price } : c)),
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    for (const item of cart) {
      await createSale({
        finishedGoodId: item.catalogItem.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        customerName: customerName || undefined,
        channel,
      }).unwrap();
    }
    setCart([]);
    setCustomerName('');
    setSuccessMsg(`Sale recorded — ${cart.length} item(s), Total: ${fmt(cartTotal)}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Catalog — 3/5 */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Product Catalog</h2>
          <input
            type="text"
            placeholder="Search products…"
            value={searchCatalog}
            onChange={(e) => setSearchCatalog(e.target.value)}
            className="input text-sm w-48"
          />
        </div>
        {catalogLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {catalog.length === 0 ? 'No items in stock. Add finished goods first.' : 'No items match the search.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
            {filteredCatalog.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="text-left p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
              >
                <p className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-700 truncate">{item.name}</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">{item.sku}</p>
                {(item.color || item.size) && (
                  <p className="text-xs text-gray-500 mt-0.5">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
                )}
                <p className="text-sm font-bold text-indigo-600 mt-1.5">
                  {fmt(Number(item.sellingPrice))}
                </p>
                <p className={`text-xs mt-0.5 font-medium ${item.quantity < 10 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {item.quantity} in stock
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart — 2/5 */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cart</h2>
        </div>

        {successMsg && (
          <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">Add items from the catalog</p>
          ) : (
            cart.map((item) => (
              <div key={item.catalogItem.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.catalogItem.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-500">Qty:</span>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.catalogItem.quantity}
                      onChange={(e) => updateQty(item.catalogItem.id, Number(e.target.value))}
                      className="w-14 text-xs text-center border border-gray-200 rounded px-1 py-0.5"
                    />
                    <span className="text-xs text-gray-500">Price:</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      min={0}
                      step="0.01"
                      onChange={(e) => updatePrice(item.catalogItem.id, Number(e.target.value))}
                      className="w-20 text-xs border border-gray-200 rounded px-1 py-0.5"
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmt(item.quantity * item.unitPrice)}</p>
                  <button
                    onClick={() => updateQty(item.catalogItem.id, 0)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart footer */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{fmt(cartTotal)}</span>
          </div>
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input w-full text-sm"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as SaleChannel)}
            className="input w-full text-sm"
          >
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button
            variant="primary"
            className="w-full"
            loading={submitting}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Record Sale ({cart.length} item{cart.length !== 1 ? 's' : ''})
          </Button>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="w-full text-xs text-gray-400 hover:text-gray-600">
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── POS Config Tab ────────────────────────────────────────────────────────────

function PosConfigTab(): React.JSX.Element {
  const { data: configData, isLoading } = useGetPosConfigQuery();
  const [upsertConfig, { isLoading: saving }] = useUpsertPosConfigMutation();
  const config = configData?.data;

  const { register, handleSubmit, formState: { errors } } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      posSystemName: config?.posSystemName ?? '',
      apiEndpoint: config?.apiEndpoint ?? '',
      syncIntervalMin: config?.syncIntervalMin ?? 30,
      isActive: config?.isActive ?? true,
    },
  });

  const onSubmit = async (values: ConfigForm) => {
    await upsertConfig({
      ...values,
      apiEndpoint: values.apiEndpoint || undefined,
    }).unwrap();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-xl bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">POS System Configuration</h2>
        <p className="text-xs text-gray-500 mt-0.5">Configure the external POS system connection for stock sync.</p>
      </div>

      {config?.lastSyncAt && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
          Last synced: {new Date(config.lastSyncAt).toLocaleString()}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="form-label">POS System Name <span className="text-red-500">*</span></label>
          <input {...register('posSystemName')} className="input w-full" placeholder="Square, Lightspeed, Custom…" />
          {errors.posSystemName && <p className="form-error">{errors.posSystemName.message}</p>}
        </div>
        <div>
          <label className="form-label">API Endpoint</label>
          <input {...register('apiEndpoint')} className="input w-full" placeholder="https://api.pos-system.com/v2" />
          {errors.apiEndpoint && <p className="form-error">{errors.apiEndpoint.message}</p>}
        </div>
        <div>
          <label className="form-label">API Key</label>
          <input {...register('apiKey')} type="password" className="input w-full" placeholder="Leave blank to keep existing" />
        </div>
        <div>
          <label className="form-label">Sync Interval (minutes)</label>
          <input {...register('syncIntervalMin')} type="number" min={1} className="input w-full" />
        </div>
        <div className="flex items-center gap-2">
          <input {...register('isActive')} type="checkbox" id="posActive" className="w-4 h-4 rounded" defaultChecked />
          <label htmlFor="posActive" className="text-sm text-gray-700 cursor-pointer">Integration Active</label>
        </div>
      </div>

      <Button variant="primary" loading={saving} onClick={handleSubmit(onSubmit)}>
        {config ? 'Update Configuration' : 'Save Configuration'}
      </Button>
    </div>
  );
}

// ── Website Sync Tab ──────────────────────────────────────────────────────────

const SYNC_STATUS_STYLE: Record<SyncStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED:  'bg-red-100 text-red-700',
  RETRY:   'bg-orange-100 text-orange-700',
};

const BASE_API = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';

function WebsiteSyncTab(): React.JSX.Element {
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useGetSyncStatusQuery();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetSyncLogsQuery();
  const [triggerSync, { isLoading: triggering }] = useTriggerSyncMutation();

  const status = statusData?.data;
  const logs = logsData?.data ?? [];

  const handleTrigger = async () => {
    try {
      await triggerSync().unwrap();
      toast.success('Sync job queued — inventory will push to the website shortly');
      setTimeout(() => { refetchStatus(); refetchLogs(); }, 3000);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to trigger sync');
    }
  };

  const pullUrl = `${window.location.origin}${BASE_API}/pos-integration/public/catalog/${status?.config?.tenantId ?? '<tenantId>'}`;

  return (
    <div className="space-y-5">
      {/* Status card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sync status */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Website Inventory Sync</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pushes finished-goods stock levels to your external website in real time.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={triggering}
              disabled={!status?.config?.apiEndpoint}
              onClick={handleTrigger}
            >
              Sync Now
            </Button>
          </div>

          {!status?.config?.apiEndpoint && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              No API endpoint configured. Go to the <strong>Configuration</strong> tab and enter your website's webhook URL.
            </div>
          )}

          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="animate-spin w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent" />
              Loading…
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Integration',
                  value: status?.config?.isActive ? 'Active' : 'Inactive',
                  color: status?.config?.isActive ? 'text-green-600' : 'text-gray-400',
                },
                {
                  label: 'Last Sync',
                  value: status?.config?.lastSyncAt
                    ? new Date(status.config.lastSyncAt).toLocaleString()
                    : 'Never',
                  color: 'text-gray-700',
                },
                {
                  label: 'Last Result',
                  value: status?.lastLog?.status ?? '—',
                  color: status?.lastLog?.status === 'SUCCESS' ? 'text-green-600'
                       : status?.lastLog?.status === 'FAILED'  ? 'text-red-600'
                       : 'text-gray-500',
                },
                {
                  label: 'Items Synced',
                  value: status?.lastLog ? `${status.lastLog.itemsSynced} / ${status.lastLog.itemsSynced + status.lastLog.itemsFailed}` : '—',
                  color: 'text-gray-700',
                },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Last error */}
          {status?.lastLog?.status === 'FAILED' && status.lastLog.errorLog && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-mono">
              {JSON.stringify(status.lastLog.errorLog, null, 2)}
            </div>
          )}
        </div>

        {/* Pull URL card */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Website Pull URL</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Your website can call this URL to fetch the latest inventory without credentials.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 break-all text-xs font-mono text-indigo-700 select-all">
            {status?.config ? pullUrl : 'Configure POS first to see the URL'}
          </div>
          {status?.config && (
            <button
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => { navigator.clipboard.writeText(pullUrl); toast.success('URL copied'); }}
            >
              Copy URL
            </button>
          )}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Response format:</p>
            <pre className="bg-gray-50 rounded p-2 text-gray-600 overflow-x-auto">{`[{ sku, name, stock, price, category, color, size }]`}</pre>
          </div>
        </div>
      </div>

      {/* Sync logs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Sync History</h3>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No sync history yet. Click "Sync Now" to run the first sync.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Started', 'Completed', 'Type', 'Status', 'Synced', 'Failed', 'Error'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {log.completedAt ? new Date(log.completedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.syncType}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SYNC_STATUS_STYLE[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-green-700 font-semibold">{log.itemsSynced}</td>
                    <td className="px-4 py-3 text-xs text-red-600 font-semibold">{log.itemsFailed}</td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">
                      {log.errorLog && log.errorLog.length > 0
                        ? (log.errorLog[0] as any)?.message ?? 'Error'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'sales' | 'terminal' | 'config' | 'sync';

export function PosSalesPage(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('sales');
  const { data: statsData, isLoading: statsLoading } = useGetSalesStatsQuery();
  const stats = statsData?.data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">POS & Sales</h1>
        <p className="text-sm text-gray-500 mt-0.5">Point of sale, sales records and revenue tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: statsLoading ? '—' : fmt(stats?.todayRevenue ?? 0), sub: `${stats?.todaySales ?? 0} sales today`, color: 'border-blue-500' },
          { label: 'Monthly Revenue', value: statsLoading ? '—' : fmt(stats?.monthRevenue ?? 0), sub: `${stats?.monthSales ?? 0} sales this month`, color: 'border-green-500' },
          { label: 'Units Sold (Month)', value: statsLoading ? '—' : (stats?.monthUnitsSold ?? 0).toLocaleString(), sub: 'units dispatched', color: 'border-purple-500' },
          { label: 'Avg Order Value', value: statsLoading ? '—' : fmt(stats?.avgOrderValue ?? 0), sub: 'per transaction', color: 'border-orange-400' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mb-0.5">{s.value}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Channel breakdown */}
      {stats && stats.byChannel.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stats.byChannel.map((ch) => (
            <div key={ch.channel} className={`rounded-xl px-4 py-2.5 flex items-center gap-2.5 ${CHANNEL_STYLE[ch.channel]}`}>
              <span className="font-bold text-lg">{ch.count}</span>
              <div>
                <p className="text-xs font-semibold">{ch.channel}</p>
                <p className="text-xs opacity-75">{fmt(ch.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        {([
          { key: 'sales' as Tab,    label: 'Sales Records' },
          { key: 'terminal' as Tab, label: 'POS Terminal' },
          { key: 'sync' as Tab,     label: '🌐 Website Sync' },
          { key: 'config' as Tab,   label: 'Configuration' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sales'    && <SalesTab />}
      {tab === 'terminal' && <PosTerminalTab />}
      {tab === 'sync'     && <WebsiteSyncTab />}
      {tab === 'config'   && <PosConfigTab />}
    </div>
  );
}
