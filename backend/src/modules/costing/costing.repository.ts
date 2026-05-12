import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QueryCalculationsDto } from './dto';

const CALC_INCLUDE = {
  lines: {
    include: {
      inventoryItem: { select: { id: true, code: true, name: true, unit: true, type: true } },
    },
    orderBy: { lineType: 'asc' } as Prisma.CostingLineOrderByWithRelationInput,
  },
  productionOrder: {
    select: {
      id: true,
      orderNumber: true,
      plannedQty: true,
      garmentType: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.CostingCalculationInclude;

@Injectable()
export class CostingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Configs ─────────────────────────────────────────────────────────────────

  async findManyConfigs(tenantId: string) {
    return this.prisma.costingConfig.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        garmentType: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findConfigById(id: string, tenantId: string) {
    return this.prisma.costingConfig.findFirst({
      where: { id, tenantId },
      include: { garmentType: { select: { id: true, name: true, code: true } } },
    });
  }

  async findDefaultConfig(tenantId: string, garmentTypeId?: string) {
    if (garmentTypeId) {
      const specific = await this.prisma.costingConfig.findFirst({
        where: { tenantId, garmentTypeId, isActive: true, isDefault: true },
      });
      if (specific) return specific;
    }
    return this.prisma.costingConfig.findFirst({
      where: { tenantId, isActive: true, isDefault: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createConfig(data: Prisma.CostingConfigCreateInput) {
    return this.prisma.costingConfig.create({
      data,
      include: { garmentType: { select: { id: true, name: true, code: true } } },
    });
  }

  async updateConfig(id: string, data: Prisma.CostingConfigUpdateInput) {
    return this.prisma.costingConfig.update({
      where: { id },
      data,
      include: { garmentType: { select: { id: true, name: true, code: true } } },
    });
  }

  async deleteConfig(id: string) {
    return this.prisma.costingConfig.delete({ where: { id } });
  }

  // ── Calculations ─────────────────────────────────────────────────────────────

  async findManyCalculations(tenantId: string, query: QueryCalculationsDto) {
    const { page, limit, skip, productionOrderId, isApproved } = query;

    const where: Prisma.CostingCalculationWhereInput = {
      tenantId,
      ...(productionOrderId && { productionOrderId }),
      ...(isApproved !== undefined && { isApproved }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.costingCalculation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: CALC_INCLUDE,
      }),
      this.prisma.costingCalculation.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findCalculationById(id: string, tenantId: string) {
    return this.prisma.costingCalculation.findFirst({
      where: { id, tenantId },
      include: CALC_INCLUDE,
    });
  }

  async findByProductionOrder(productionOrderId: string) {
    return this.prisma.costingCalculation.findUnique({ where: { productionOrderId } });
  }

  async createCalculation(
    calcData: Prisma.CostingCalculationCreateInput,
    lines: Omit<Prisma.CostingLineCreateManyInput, 'costingCalculationId'>[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const calc = await tx.costingCalculation.create({ data: calcData });
      if (lines.length > 0) {
        await tx.costingLine.createMany({
          data: lines.map((l) => ({ ...l, costingCalculationId: calc.id })),
        });
      }
      return tx.costingCalculation.findUniqueOrThrow({
        where: { id: calc.id },
        include: CALC_INCLUDE,
      });
    });
  }

  async updateCalculation(id: string, data: Prisma.CostingCalculationUpdateInput) {
    return this.prisma.costingCalculation.update({
      where: { id },
      data,
      include: CALC_INCLUDE,
    });
  }

  async approveCalculation(id: string, approvedById: string) {
    return this.prisma.costingCalculation.update({
      where: { id },
      data: { isApproved: true, approvedById, approvedAt: new Date() },
      include: CALC_INCLUDE,
    });
  }

  // ── Wastage ──────────────────────────────────────────────────────────────────

  async findWastageByBatch(batchId: string, tenantId: string) {
    return this.prisma.wastageRecord.findMany({
      where: { batchId, tenantId },
      orderBy: { recordedAt: 'desc' },
      include: {
        batch: { select: { batchNumber: true } },
      },
    });
  }

  async createWastage(data: Prisma.WastageRecordCreateInput) {
    return this.prisma.wastageRecord.create({
      data,
      include: {
        batch: { select: { batchNumber: true } },
      },
    });
  }
}
