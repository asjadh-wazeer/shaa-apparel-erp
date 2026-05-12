export interface FinishedGood {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  posItemId?: string;
  lastSyncedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinishedGoodStats {
  totalSkus: number;
  activeSkus: number;
  totalUnitsInStock: number;
  avgSellingPrice: number;
  readyToDispatch: number;
}

export type StockAdjustmentType = 'IN' | 'OUT';

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateFinishedGoodPayload {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  size?: string;
  quantity?: number;
  unitCost?: number;
  sellingPrice?: number;
  posItemId?: string;
  isActive?: boolean;
}

export interface UpdateFinishedGoodPayload extends Partial<CreateFinishedGoodPayload> {}

export interface AdjustStockPayload {
  type: StockAdjustmentType;
  quantity: number;
  reason?: string;
}

export interface FinishedGoodsQueryParams {
  search?: string;
  category?: string;
  color?: string;
  size?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
