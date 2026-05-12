interface InventoryItemRef {
  id: string;
  code: string;
  name: string;
  unit: string;
  type?: string;
  costPerUnit?: number;
}

export interface GarmentType {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  garmentAccessories?: GarmentAccessory[];
  _count?: { garmentAccessories: number; productionOrders: number };
}

export interface GarmentTypeOption {
  id: string;
  code: string;
  name: string;
}

export interface GarmentAccessory {
  id: string;
  garmentTypeId: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  notes?: string;
  inventoryItem: InventoryItemRef;
}

export interface CostingConfig {
  id: string;
  tenantId: string;
  garmentTypeId?: string;
  name: string;
  laborCostPerPcs: number;
  overheadPercent: number;
  profitMarginPct: number;
  wastageMinPct: number;
  wastageMaxPct: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  garmentType?: { id: string; name: string; code: string };
}

export interface CostingLine {
  id: string;
  costingCalculationId: string;
  inventoryItemId: string;
  lineType: string;
  quantity: number;
  unitCost: number;
  wastagePercent: number;
  wastageQty: number;
  totalCost: number;
  notes?: string;
  inventoryItem: InventoryItemRef;
}

export interface CostingCalculation {
  id: string;
  tenantId: string;
  productionOrderId: string;
  costingConfigId?: string;
  totalFabricCost: number;
  totalAccessoryCost: number;
  totalLaborCost: number;
  totalWastageCost: number;
  overheadCost: number;
  totalCost: number;
  costPerPiece: number;
  sellingPricePerPcs: number;
  profitMarginPct: number;
  isApproved: boolean;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: CostingLine[];
  productionOrder?: {
    id: string;
    orderNumber: string;
    plannedQty: number;
    garmentType?: { id: string; name: string; code: string };
  };
}

export interface WastageRecord {
  id: string;
  tenantId: string;
  batchId: string;
  inventoryItemId?: string;
  wastageType: string;
  quantity: number;
  wastagePercent: number;
  isThresholdExceeded: boolean;
  reason?: string;
  recordedAt: string;
  batch?: { batchNumber: string };
  inventoryItem?: InventoryItemRef;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateGarmentTypePayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGarmentTypePayload extends Partial<CreateGarmentTypePayload> {}

export interface CreateAccessoryPayload {
  inventoryItemId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface UpdateAccessoryPayload extends Partial<Omit<CreateAccessoryPayload, 'inventoryItemId'>> {}

export interface CreateCostingConfigPayload {
  name: string;
  garmentTypeId?: string;
  laborCostPerPcs: number;
  overheadPercent: number;
  profitMarginPct: number;
  wastageMinPct: number;
  wastageMaxPct: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateCostingConfigPayload extends Partial<CreateCostingConfigPayload> {}

export interface CreateCalculationPayload {
  productionOrderId: string;
  costingConfigId?: string;
  sellingPricePerPcs?: number;
  notes?: string;
}

export interface UpdateCalculationPayload {
  sellingPricePerPcs?: number;
  profitMarginPct?: number;
  notes?: string;
}

export interface RecordWastagePayload {
  batchId: string;
  inventoryItemId?: string;
  wastageType: string;
  quantity: number;
  wastagePercent: number;
  isThresholdExceeded?: boolean;
  reason?: string;
}
