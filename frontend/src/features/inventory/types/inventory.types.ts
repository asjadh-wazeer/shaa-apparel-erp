import { PaginationMeta, InventoryItemType } from '../../../shared/types';

export type { InventoryItemType };

export type StockMovementType =
  | 'PURCHASE_RECEIVED'
  | 'PRODUCTION_ISSUED'
  | 'PRODUCTION_RETURNED'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'WASTAGE'
  | 'SALE'
  | 'OPENING_BALANCE';

export type StockMovementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface WarehouseRef {
  id: string;
  name: string;
  code: string;
}

export interface WarehouseStockEntry {
  id: string;
  warehouseId: string;
  inventoryItemId: string;
  quantity: number;
  reservedQty: number;
  avgCostPerUnit: number;
  updatedAt: string;
  warehouse: WarehouseRef;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: InventoryItemType;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  costPerUnit: number;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  warehouseStock?: WarehouseStockEntry[];
  totalQty?: number;
  stockLevels?: WarehouseStockEntry[];
}

export interface StockMovement {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  warehouseId?: string;
  type: StockMovementType;
  status: StockMovementStatus;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedById?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  tenantId: string;
  factoryId?: string;
  name: string;
  code: string;
  location?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  factory?: { id: string; name: string; code: string };
  totalItems?: number;
  lowStockCount?: number;
  totalValue?: number;
}

export interface WarehouseStockLine {
  id: string;
  warehouseId: string;
  inventoryItemId: string;
  quantity: number;
  reservedQty: number;
  avgCostPerUnit: number;
  updatedAt: string;
  inventoryItem: {
    id: string;
    code: string;
    name: string;
    type: InventoryItemType;
    unit: string;
    reorderLevel: number;
    isActive: boolean;
  };
}

// DTO shapes for mutations ─────────────────────────────────────────────────────

export interface CreateInventoryItemPayload {
  code: string;
  name: string;
  description?: string;
  type: InventoryItemType;
  unit: string;
  reorderLevel?: number;
  reorderQuantity?: number;
  costPerUnit?: number;
  barcode?: string;
  isActive?: boolean;
}

export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {}

export interface CreateStockMovementPayload {
  type: StockMovementType;
  quantity: number;
  warehouseId?: string;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  location?: string;
  factoryId?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehousePayload extends Partial<CreateWarehousePayload> {}

// API response wrappers ────────────────────────────────────────────────────────

export interface InventoryListResponse {
  success: boolean;
  data: InventoryItem[];
  meta: PaginationMeta;
}

export interface WarehouseListResponse {
  success: boolean;
  data: Warehouse[];
  meta: PaginationMeta;
}

export interface WarehouseStockListResponse {
  success: boolean;
  data: WarehouseStockLine[];
  meta: PaginationMeta;
}

export interface MovementListResponse {
  success: boolean;
  data: StockMovement[];
  meta: PaginationMeta;
}

export interface StockLevelResponse {
  success: boolean;
  data: {
    item: { id: string; code: string; name: string; unit: string };
    totalQty: number;
    reorderLevel: number;
    isLowStock: boolean;
    stockLevels: WarehouseStockEntry[];
  };
}
