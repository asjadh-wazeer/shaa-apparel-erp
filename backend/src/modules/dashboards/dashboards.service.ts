import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QualityCheckResult } from '@prisma/client';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      productionStats,
      lowStockCount,
      outOfStockCount,
      attendanceToday,
      qcStats,
      qcThisMonth,
      finishedGoodsAgg,
      finishedGoodsCount,
      recentOrders,
      pendingPurchaseOrders,
      activeEmployees,
    ] = await Promise.all([
      // Production order counts by status
      this.prisma.productionOrder.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),

      // Low stock (total warehouse qty > 0 and below reorderLevel)
      this.prisma.$queryRaw<[{ count: BigInt }]>`
        SELECT COUNT(*) as count
        FROM inventory_items i
        LEFT JOIN (SELECT inventoryItemId, SUM(quantity) as totalQty FROM warehouse_stock GROUP BY inventoryItemId) s
          ON s.inventoryItemId = i.id
        WHERE i.tenantId = ${tenantId} AND i.deletedAt IS NULL
          AND COALESCE(s.totalQty, 0) > 0 AND COALESCE(s.totalQty, 0) < i.reorderLevel
      `.then((r) => Number(r[0].count)),

      // Out of stock
      this.prisma.$queryRaw<[{ count: BigInt }]>`
        SELECT COUNT(*) as count
        FROM inventory_items i
        LEFT JOIN (SELECT inventoryItemId, SUM(quantity) as totalQty FROM warehouse_stock GROUP BY inventoryItemId) s
          ON s.inventoryItemId = i.id
        WHERE i.tenantId = ${tenantId} AND i.deletedAt IS NULL AND COALESCE(s.totalQty, 0) = 0
      `.then((r) => Number(r[0].count)),

      // Attendance today
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { tenantId, date: new Date(todayStr) },
        _count: true,
      }),

      // QC totals
      this.prisma.qualityCheck.aggregate({
        where: { tenantId },
        _count: { id: true },
        _sum: { inspectedQty: true, passedQty: true, failedQty: true },
      }),

      // QC this month
      this.prisma.qualityCheck.count({
        where: {
          tenantId,
          result: QualityCheckResult.PASSED,
          inspectedAt: { gte: monthStart, lte: monthEnd },
        },
      }),

      // Finished goods total stock value
      this.prisma.finishedGood.aggregate({
        where: { tenantId, isActive: true },
        _sum: { quantity: true },
        _count: { id: true },
      }),

      // Total finished goods SKUs
      this.prisma.finishedGood.count({ where: { tenantId, isActive: true, quantity: { gt: 0 } } }),

      // Recent production orders with batches
      this.prisma.productionOrder.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          batches: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              stageHistories: {
                where: { status: 'IN_PROGRESS' },
                include: { stageConfig: { select: { name: true, code: true } } },
                take: 1,
              },
            },
          },
        },
      }),

      // Pending purchase orders
      this.prisma.purchaseOrder.count({
        where: { tenantId, status: { in: ['SUBMITTED', 'APPROVED'] } },
      }),

      // Active employees
      this.prisma.employee.count({ where: { tenantId, isActive: true, deletedAt: null } }),
    ]);

    // Build production status map
    const prodMap = productionStats.reduce(
      (acc, row) => { acc[row.status] = row._count; return acc; },
      {} as Record<string, number>,
    );
    const totalOrders = Object.values(prodMap).reduce((s, v) => s + v, 0);
    const activeOrders = (prodMap['IN_PROGRESS'] ?? 0) + (prodMap['PENDING'] ?? 0);

    // Build attendance map
    const attMap = attendanceToday.reduce(
      (acc, row) => { acc[row.status] = row._count; return acc; },
      {} as Record<string, number>,
    );

    // QC pass rate
    const totalInspected = qcStats._sum.inspectedQty ?? 0;
    const totalPassed = qcStats._sum.passedQty ?? 0;
    const passRate = totalInspected > 0 ? Math.round((totalPassed / totalInspected) * 100) : 0;

    // Build pipeline rows from recent orders
    const pipeline = recentOrders.map((order) => {
      const latestBatch = order.batches[0];
      const currentStage = latestBatch?.stageHistories[0]?.stageConfig;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        description: order.description,
        status: order.status,
        plannedQty: latestBatch?.plannedQty ?? 0,
        currentStage: currentStage?.name ?? null,
        currentStageCode: currentStage?.code ?? null,
      };
    });

    return {
      production: {
        total: totalOrders,
        active: activeOrders,
        completed: prodMap['COMPLETED'] ?? 0,
        byStatus: prodMap,
      },
      inventory: {
        lowStockCount,
        outOfStockCount,
      },
      attendance: {
        present: attMap['PRESENT'] ?? 0,
        absent: attMap['ABSENT'] ?? 0,
        late: attMap['LATE'] ?? 0,
        halfDay: attMap['HALF_DAY'] ?? 0,
        onLeave: attMap['ON_LEAVE'] ?? 0,
        total: Object.values(attMap).reduce((s, v) => s + v, 0),
        activeEmployees,
      },
      qc: {
        totalChecks: qcStats._count.id,
        passedThisMonth: qcThisMonth,
        totalInspected,
        totalPassed,
        totalFailed: qcStats._sum.failedQty ?? 0,
        passRate,
      },
      finishedGoods: {
        readySkus: finishedGoodsCount,
        totalUnits: finishedGoodsAgg._sum.quantity ?? 0,
      },
      purchasing: {
        pendingOrders: pendingPurchaseOrders,
      },
      pipeline,
    };
  }
}
