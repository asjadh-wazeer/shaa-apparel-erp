import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse, buildPaginationMeta } from '../../common/utils/pagination.util';
import { QueryProductionOrdersDto } from './dto/query-production-orders.dto';
import { Prisma } from '@prisma/client';

const DEFAULT_STAGES = [
  { code: 'DESIGN',    name: 'Design',         orderIndex: 1, isMandatory: true },
  { code: 'PATTERN',   name: 'Pattern Making',  orderIndex: 2, isMandatory: true },
  { code: 'SAMPLE',    name: 'Sample Making',   orderIndex: 3, isMandatory: false },
  { code: 'CUTTING',   name: 'Cutting',         orderIndex: 4, isMandatory: true },
  { code: 'SEWING',    name: 'Sewing',          orderIndex: 5, isMandatory: true },
  { code: 'QC',        name: 'Quality Control', orderIndex: 6, isMandatory: true },
  { code: 'FINISHING', name: 'Finishing',       orderIndex: 7, isMandatory: true },
];

const ORDER_INCLUDE = {
  factory: { select: { id: true, name: true, code: true } },
  garmentType: { select: { id: true, name: true, code: true } },
  batches: {
    where: { status: { not: 'CANCELLED' as const } },
    select: {
      id: true,
      batchNumber: true,
      status: true,
      plannedQty: true,
      completedQty: true,
      currentStageId: true,
      startedAt: true,
      completedAt: true,
      stageHistories: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          stageConfig: { select: { id: true, name: true, code: true, orderIndex: true } },
        },
      },
    },
  },
  _count: { select: { batches: true, qualityChecks: true } },
} satisfies Prisma.ProductionOrderInclude;

@Injectable()
export class ProductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStageConfigs(tenantId: string) {
    const existing = await this.prisma.productionStageConfig.findMany({
      where: { tenantId, isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
    if (existing.length > 0) return existing;
    return this.seedDefaultStages(tenantId);
  }

  async seedDefaultStages(tenantId: string) {
    await this.prisma.productionStageConfig.createMany({
      data: DEFAULT_STAGES.map((s) => ({ ...s, tenantId })),
      skipDuplicates: true,
    });
    return this.prisma.productionStageConfig.findMany({
      where: { tenantId, isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findMany(tenantId: string, query: QueryProductionOrdersDto) {
    const { page, limit, search, status, factoryId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductionOrderWhereInput = {
      tenantId,
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(factoryId && { factoryId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        include: {
          factory: { select: { id: true, name: true, code: true } },
          garmentType: { select: { id: true, name: true, code: true } },
          batches: {
            where: { status: { not: 'CANCELLED' } },
            select: {
              id: true,
              batchNumber: true,
              status: true,
              plannedQty: true,
              completedQty: true,
              currentStageId: true,
              stageHistories: {
                orderBy: { createdAt: 'asc' },
                include: {
                  stageConfig: { select: { id: true, name: true, code: true, orderIndex: true } },
                },
              },
            },
          },
          _count: { select: { batches: true } },
        },
      }),
      this.prisma.productionOrder.count({ where }),
    ]);

    return buildPaginatedResponse(orders, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.productionOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: ORDER_INCLUDE,
    });
  }

  async create(tenantId: string, data: Prisma.ProductionOrderCreateInput) {
    return this.prisma.productionOrder.create({
      data,
      include: ORDER_INCLUDE,
    });
  }

  async update(id: string, tenantId: string, data: Prisma.ProductionOrderUpdateInput) {
    return this.prisma.productionOrder.update({
      where: { id },
      data,
      include: ORDER_INCLUDE,
    });
  }

  async softDelete(id: string, tenantId: string) {
    return this.prisma.productionOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createBatch(
    productionOrderId: string,
    data: { batchNumber: string; plannedQty: number; notes?: string },
    stageConfigs: { id: string; orderIndex: number }[],
  ) {
    const firstStage = stageConfigs.sort((a, b) => a.orderIndex - b.orderIndex)[0];
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.productionBatch.create({
        data: {
          productionOrderId,
          batchNumber: data.batchNumber,
          plannedQty: data.plannedQty,
          notes: data.notes,
          status: 'OPEN',
          currentStageId: firstStage.id,
          startedAt: new Date(),
        },
      });

      await tx.productionStageHistory.createMany({
        data: stageConfigs.map((sc, i) => ({
          batchId: batch.id,
          stageConfigId: sc.id,
          plannedQty: data.plannedQty,
          status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
          startedAt: i === 0 ? new Date() : undefined,
        })),
      });

      return batch;
    });
  }

  async findBatchById(batchId: string, productionOrderId: string) {
    return this.prisma.productionBatch.findFirst({
      where: { id: batchId, productionOrderId },
      include: {
        stageHistories: {
          orderBy: { createdAt: 'asc' },
          include: {
            stageConfig: true,
          },
        },
        productionOrder: { select: { id: true, orderNumber: true, tenantId: true } },
      },
    });
  }

  async advanceStage(
    batchId: string,
    currentStageHistoryId: string,
    nextStageConfigId: string | null,
    completedData: {
      completedQty: number;
      rejectedQty: number;
      actualMinutes?: number;
      notes?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.productionStageHistory.update({
        where: { id: currentStageHistoryId },
        data: {
          status: 'COMPLETED',
          completedQty: completedData.completedQty,
          rejectedQty: completedData.rejectedQty,
          actualMinutes: completedData.actualMinutes,
          notes: completedData.notes,
          completedAt: new Date(),
        },
      });

      if (nextStageConfigId) {
        await tx.productionStageHistory.updateMany({
          where: { batchId, stageConfigId: nextStageConfigId },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
        await tx.productionBatch.update({
          where: { id: batchId },
          data: { currentStageId: nextStageConfigId, status: 'IN_PROGRESS' },
        });
      } else {
        await tx.productionBatch.update({
          where: { id: batchId },
          data: {
            status: 'COMPLETED',
            completedQty: completedData.completedQty,
            completedAt: new Date(),
          },
        });
      }
    });
  }

  async findBatchesByStage(tenantId: string, stageCodes: string[]) {
    const stageConfigs = await this.prisma.productionStageConfig.findMany({
      where: { tenantId, code: { in: stageCodes }, isActive: true },
      select: { id: true },
    });
    const stageConfigIds = stageConfigs.map((s) => s.id);

    return this.prisma.productionBatch.findMany({
      where: {
        currentStageId: { in: stageConfigIds },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        productionOrder: { tenantId, deletedAt: null },
      },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            description: true,
            status: true,
            plannedQty: true,
            priority: true,
          },
        },
        stageHistories: {
          include: { stageConfig: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { productionOrder: { priority: 'asc' } },
        { createdAt: 'asc' },
      ],
    });
  }

  async getDashboardStats(tenantId: string) {
    const [total, inProgress, completed, draft] = await this.prisma.$transaction([
      this.prisma.productionOrder.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.productionOrder.count({ where: { tenantId, deletedAt: null, status: 'IN_PROGRESS' } }),
      this.prisma.productionOrder.count({ where: { tenantId, deletedAt: null, status: 'COMPLETED' } }),
      this.prisma.productionOrder.count({ where: { tenantId, deletedAt: null, status: 'DRAFT' } }),
    ]);
    return { total, inProgress, completed, draft };
  }

  async countActiveBatchesForOrder(productionOrderId: string) {
    return this.prisma.productionBatch.count({
      where: {
        productionOrderId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
  }

  async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.productionOrder.count({ where: { tenantId } });
    return `PO-${String(count + 1).padStart(4, '0')}`;
  }

  async generateBatchNumber(productionOrderId: string): Promise<string> {
    const count = await this.prisma.productionBatch.count({ where: { productionOrderId } });
    return `B-${productionOrderId.slice(-4).toUpperCase()}-${String(count + 1).padStart(2, '0')}`;
  }
}
