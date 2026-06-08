export type SaleChannel = 'POS' | 'ONLINE' | 'WHOLESALE' | 'DIRECT';
export type SaleStatus = 'COMPLETED' | 'INVOICED' | 'REFUNDED' | 'CANCELLED';

export interface SaleRecord {
  id: string;
  tenantId: string;
  saleNumber: string;
  finishedGoodId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName?: string;
  channel: SaleChannel;
  status: SaleStatus;
  notes?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  finishedGood: { id: string; sku: string; name: string; category: string | null };
}

export interface SalesStats {
  todayRevenue: number;
  todaySales: number;
  monthRevenue: number;
  monthSales: number;
  monthUnitsSold: number;
  avgOrderValue: number;
  totalRevenue: number;
  totalSales: number;
  byChannel: { channel: SaleChannel; revenue: number; count: number }[];
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  sellingPrice: number;
}

export interface PosConfig {
  id: string;
  tenantId: string;
  posSystemName: string;
  apiEndpoint?: string;
  syncIntervalMin: number;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateSalePayload {
  finishedGoodId: string;
  quantity: number;
  unitPrice: number;
  customerName?: string;
  channel?: SaleChannel;
  status?: SaleStatus;
  notes?: string;
  saleDate?: string;
}

export interface UpdateSalePayload {
  status?: SaleStatus;
  notes?: string;
  customerName?: string;
}

export interface UpsertPosConfigPayload {
  posSystemName: string;
  apiEndpoint?: string;
  apiKey?: string;
  syncIntervalMin?: number;
  isActive?: boolean;
}

export interface SalesQueryParams {
  dateFrom?: string;
  dateTo?: string;
  channel?: SaleChannel;
  status?: SaleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CartItem {
  catalogItem: CatalogItem;
  quantity: number;
  unitPrice: number;
}

// ── Website Sync ──────────────────────────────────────────────────────────────

export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRY';

export interface PosSyncLog {
  id: string;
  tenantId: string;
  posConfigId: string;
  syncType: string;
  status: SyncStatus;
  itemsSynced: number;
  itemsFailed: number;
  errorLog?: any[];
  startedAt: string;
  completedAt?: string;
  retryCount: number;
}

export interface SyncStatusResponse {
  config: PosConfig | null;
  lastLog: PosSyncLog | null;
}
