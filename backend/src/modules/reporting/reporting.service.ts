import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Production Report ──────────────────────────────────────────────────────

  async getProductionReport(tenantId: string, params: { dateFrom?: string; dateTo?: string; status?: string }) {
    const where: any = { tenantId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const orders = await this.prisma.productionOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        batches: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
            plannedQty: true,
            completedQty: true,
          },
        },
      },
    });

    return orders.map((o) => {
      const totalPlanned = o.batches.reduce((s: number, b: any) => s + b.plannedQty, 0);
      const totalCompleted = o.batches.reduce((s: number, b: any) => s + b.completedQty, 0);
      const totalRejected = 0;
      return {
        orderNumber: o.orderNumber,
        description: o.description,
        status: o.status,
        plannedQty: o.plannedQty,
        batchCount: o.batches.length,
        totalPlanned,
        totalCompleted,
        totalRejected,
        yieldRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });
  }

  // ── Inventory Report ───────────────────────────────────────────────────────

  async getInventoryReport(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        warehouseStock: { include: { warehouse: { select: { name: true, code: true } } } },
      },
    });

    return items.map((item) => {
      const totalStock = item.warehouseStock.reduce((s, ws) => s + Number(ws.quantity), 0);
      const reorderLevel = Number(item.reorderLevel);
      return {
        code: item.code,
        name: item.name,
        type: item.type,
        unit: item.unit,
        currentStock: totalStock,
        reorderLevel,
        isLowStock: totalStock < reorderLevel,
        isOutOfStock: totalStock === 0,
        costPerUnit: Number(item.costPerUnit),
        warehouseBreakdown: item.warehouseStock.map((ws) => ({
          warehouse: ws.warehouse.name,
          qty: Number(ws.quantity),
        })),
      };
    });
  }

  // ── Attendance Report ──────────────────────────────────────────────────────

  async getAttendanceReport(tenantId: string, month: string) {
    const [year, mon] = month.split('-').map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 0, 23, 59, 59);

    const records = await this.prisma.attendance.findMany({
      where: { tenantId, date: { gte: from, lte: to } },
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, department: true, jobTitle: true },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });

    // Group by employee
    const grouped = new Map<string, { employee: any; present: number; absent: number; late: number; halfDay: number; onLeave: number; total: number }>();
    for (const r of records) {
      const key = r.employeeId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employee: r.employee,
          present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, total: 0,
        });
      }
      const row = grouped.get(key)!;
      row.total++;
      if (r.status === 'PRESENT') row.present++;
      else if (r.status === 'ABSENT') row.absent++;
      else if (r.status === 'LATE') row.late++;
      else if (r.status === 'HALF_DAY') row.halfDay++;
      else if (r.status === 'ON_LEAVE') row.onLeave++;
    }

    return Array.from(grouped.values()).map(({ employee, ...counts }) => ({
      employeeCode: employee.employeeCode,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department ?? '—',
      jobTitle: employee.jobTitle ?? '—',
      ...counts,
      attendanceRate: counts.total > 0
        ? Math.round(((counts.present + counts.late) / counts.total) * 100)
        : 0,
    }));
  }

  // ── Quality Report ─────────────────────────────────────────────────────────

  async getQualityReport(tenantId: string, params: { dateFrom?: string; dateTo?: string }) {
    const where: any = { tenantId };
    if (params.dateFrom || params.dateTo) {
      where.inspectedAt = {};
      if (params.dateFrom) where.inspectedAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.inspectedAt.lte = new Date(params.dateTo);
    }

    const checks = await this.prisma.qualityCheck.findMany({
      where,
      orderBy: { inspectedAt: 'desc' },
      include: {
        productionOrder: { select: { orderNumber: true, description: true } },
        defects: true,
      },
    });

    return checks.map((c) => {
      const defectsByType = c.defects.reduce(
        (acc, d) => { acc[d.severity] = (acc[d.severity] ?? 0) + d.quantity; return acc; },
        {} as Record<string, number>,
      );
      return {
        checkNumber: c.checkNumber,
        orderNumber: c.productionOrder?.orderNumber ?? '—',
        result: c.result,
        inspectedQty: c.inspectedQty,
        passedQty: c.passedQty,
        failedQty: c.failedQty,
        reworkQty: c.reworkQty,
        passRate: c.inspectedQty > 0
          ? Math.round((c.passedQty / c.inspectedQty) * 100)
          : 0,
        defectCount: c.defects.length,
        minorDefects: defectsByType['MINOR'] ?? 0,
        majorDefects: defectsByType['MAJOR'] ?? 0,
        criticalDefects: defectsByType['CRITICAL'] ?? 0,
        approved: !!c.approvedAt,
        inspectedAt: c.inspectedAt,
      };
    });
  }

  // ── KPI Report ─────────────────────────────────────────────────────────────

  async getKpiReport(tenantId: string, params: { month?: number; year?: number }) {
    const where: any = { tenantId };
    if (params.month) where.month = params.month;
    if (params.year) where.year = params.year;

    const records = await this.prisma.kpiRecord.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { employeeCode: 'asc' } }],
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, department: true, jobTitle: true },
        },
      },
    });

    return records.map((r) => ({
      employeeCode: r.employee.employeeCode,
      name: `${r.employee.firstName} ${r.employee.lastName}`,
      department: r.employee.department ?? '—',
      jobTitle: r.employee.jobTitle ?? '—',
      month: r.month,
      year: r.year,
      metric: r.metric,
      target: r.target,
      actual: r.actual,
      achievement: r.target && Number(r.target) > 0
        ? Math.round((Number(r.actual) / Number(r.target)) * 100)
        : null,
      incentiveAmount: r.incentiveAmount,
      notes: r.notes,
    }));
  }
}
