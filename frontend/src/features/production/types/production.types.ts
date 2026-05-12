import { ProductionOrderStatus } from '../../../shared/types';

export type { ProductionOrderStatus };

export type ProductionBatchStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProductionStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'BLOCKED';

export interface StageConfig {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  isMandatory: boolean;
}

export interface StageConfigRef {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
}

export interface StageHistory {
  id: string;
  batchId: string;
  stageConfigId: string;
  status: ProductionStageStatus;
  plannedQty: number;
  completedQty: number;
  rejectedQty: number;
  operatorId?: string;
  startedAt?: string;
  completedAt?: string;
  targetMinutes?: number;
  actualMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  stageConfig: StageConfigRef;
}

export interface ProductionBatch {
  id: string;
  productionOrderId: string;
  batchNumber: string;
  status: ProductionBatchStatus;
  plannedQty: number;
  completedQty: number;
  currentStageId?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  stageHistories: StageHistory[];
  productionOrder?: {
    id: string;
    orderNumber: string;
    description?: string;
    status: ProductionOrderStatus;
    plannedQty: number;
    priority: number;
  };
}

export interface ProductionOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  description?: string;
  status: ProductionOrderStatus;
  plannedQty: number;
  completedQty: number;
  rejectedQty: number;
  priority: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
  createdById?: string;
  factoryId?: string;
  garmentTypeId?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  factory?: { id: string; name: string; code: string };
  garmentType?: { id: string; name: string; code: string };
  batches: ProductionBatch[];
  _count?: { batches: number };
}

export interface ProductionStats {
  total: number;
  inProgress: number;
  completed: number;
  draft: number;
}

// DTO shapes ────────────────────────────────────────────────────────────────────

export interface CreateProductionOrderPayload {
  orderNumber?: string;
  description?: string;
  factoryId?: string;
  garmentTypeId?: string;
  plannedQty: number;
  priority?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  notes?: string;
}

export interface UpdateProductionOrderPayload extends Partial<CreateProductionOrderPayload> {
  status?: ProductionOrderStatus;
}

export interface CreateProductionBatchPayload {
  batchNumber?: string;
  plannedQty: number;
  notes?: string;
}

export interface AdvanceStagePayload {
  completedQty: number;
  rejectedQty?: number;
  actualMinutes?: number;
  notes?: string;
}
