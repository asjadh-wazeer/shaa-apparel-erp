export interface ProductionReportRow {
  orderNumber: string;
  description: string;
  status: string;
  plannedQty: number;
  batchCount: number;
  totalPlanned: number;
  totalCompleted: number;
  totalRejected: number;
  yieldRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReportRow {
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  currentStock: number;
  reorderPoint: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  averageCost: number;
  supplier: string | null;
  warehouseBreakdown: { warehouse: string; qty: number }[];
}

export interface AttendanceReportRow {
  employeeCode: string;
  name: string;
  department: string;
  jobTitle: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  total: number;
  attendanceRate: number;
}

export interface QualityReportRow {
  checkNumber: string;
  orderNumber: string;
  result: string;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  reworkQty: number;
  passRate: number;
  defectCount: number;
  minorDefects: number;
  majorDefects: number;
  criticalDefects: number;
  approved: boolean;
  inspectedAt: string;
}

export interface KpiReportRow {
  employeeCode: string;
  name: string;
  department: string;
  jobTitle: string;
  month: number;
  year: number;
  metric: string;
  target: number | null;
  actual: number;
  achievement: number | null;
  incentiveAmount: number | null;
  notes: string | null;
}

export interface ProductionReportParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface AttendanceReportParams {
  month?: string;
}

export interface QualityReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface KpiReportParams {
  month?: number;
  year?: number;
}
