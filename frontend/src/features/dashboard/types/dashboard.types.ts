export interface DashboardPipelineRow {
  id: string;
  orderNumber: string;
  description: string;
  status: string;
  plannedQty: number;
  currentStage: string | null;
  currentStageCode: string | null;
}

export interface DashboardOverview {
  production: {
    total: number;
    active: number;
    completed: number;
    byStatus: Record<string, number>;
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    onLeave: number;
    total: number;
    activeEmployees: number;
  };
  qc: {
    totalChecks: number;
    passedThisMonth: number;
    totalInspected: number;
    totalPassed: number;
    totalFailed: number;
    passRate: number;
  };
  finishedGoods: {
    readySkus: number;
    totalUnits: number;
  };
  purchasing: {
    pendingOrders: number;
  };
  pipeline: DashboardPipelineRow[];
}
