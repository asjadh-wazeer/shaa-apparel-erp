export type QualityCheckResult = 'PASSED' | 'FAILED' | 'CONDITIONAL_PASS';
export type DefectSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type ReworkStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface DefectRecord {
  id: string;
  qualityCheckId: string;
  defectCode: string;
  defectName: string;
  severity: DefectSeverity;
  quantity: number;
  stageId?: string;
  description?: string;
}

export interface ReworkRecord {
  id: string;
  qualityCheckId: string;
  reworkType: string;
  quantity: number;
  status: ReworkStatus;
  assignedToId?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheck {
  id: string;
  tenantId: string;
  productionOrderId: string;
  checkNumber: string;
  result: QualityCheckResult;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  reworkQty: number;
  inspectedById?: string;
  inspectedAt: string;
  notes?: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  productionOrder: { id: string; orderNumber: string; description: string };
  defects: DefectRecord[];
  reworks: ReworkRecord[];
}

export interface QcStats {
  totalChecks: number;
  passed: number;
  failed: number;
  conditionalPass: number;
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  totalRework: number;
  defectsBySeverity: Partial<Record<DefectSeverity, number>>;
}

// ── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateDefectPayload {
  defectCode: string;
  defectName: string;
  severity: DefectSeverity;
  quantity: number;
  stageId?: string;
  description?: string;
}

export interface CreateQualityCheckPayload {
  productionOrderId: string;
  checkNumber: string;
  result: QualityCheckResult;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  reworkQty?: number;
  inspectedById?: string;
  inspectedAt?: string;
  notes?: string;
  defects?: CreateDefectPayload[];
}

export interface UpdateQualityCheckPayload {
  result?: QualityCheckResult;
  inspectedQty?: number;
  passedQty?: number;
  failedQty?: number;
  reworkQty?: number;
  notes?: string;
}

export interface AddReworkPayload {
  reworkType: string;
  quantity: number;
  assignedToId?: string;
  notes?: string;
}

export interface UpdateReworkPayload {
  status?: ReworkStatus;
  assignedToId?: string;
  notes?: string;
}

export interface QcQueryParams {
  productionOrderId?: string;
  result?: QualityCheckResult;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
