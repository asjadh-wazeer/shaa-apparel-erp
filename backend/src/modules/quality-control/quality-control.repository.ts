import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QualityCheckResult, DefectSeverity, Prisma } from '@prisma/client';
import { CreateQualityCheckDto, CreateDefectDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { AddReworkDto, UpdateReworkDto } from './dto/add-rework.dto';

const CHECK_INCLUDE = {
  productionOrder: { select: { id: true, orderNumber: true, description: true } },
  defects: true,
  reworks: true,
} satisfies Prisma.QualityCheckInclude;

@Injectable()
export class QualityControlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    tenantId: string,
    params: {
      productionOrderId?: string;
      result?: QualityCheckResult;
      dateFrom?: string;
      dateTo?: string;
      page: number;
      limit: number;
    },
  ) {
    const { productionOrderId, result, dateFrom, dateTo, page, limit } = params;
    const where: Prisma.QualityCheckWhereInput = {
      tenantId,
      ...(productionOrderId && { productionOrderId }),
      ...(result && { result }),
      ...(dateFrom || dateTo
        ? {
            inspectedAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.qualityCheck.findMany({
        where,
        include: CHECK_INCLUDE,
        orderBy: { inspectedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.qualityCheck.count({ where }),
    ]);

    return { data, total };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.qualityCheck.findFirst({
      where: { id, tenantId },
      include: CHECK_INCLUDE,
    });
  }

  async create(tenantId: string, dto: CreateQualityCheckDto) {
    const { defects, ...rest } = dto;
    return this.prisma.qualityCheck.create({
      data: {
        tenantId,
        ...rest,
        ...(defects?.length
          ? {
              defects: {
                create: defects.map((d: CreateDefectDto) => ({ ...d })),
              },
            }
          : {}),
      },
      include: CHECK_INCLUDE,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateQualityCheckDto) {
    return this.prisma.qualityCheck.update({
      where: { id },
      data: { tenantId, ...dto },
      include: CHECK_INCLUDE,
    });
  }

  async approve(tenantId: string, id: string, approvedById: string) {
    return this.prisma.qualityCheck.update({
      where: { id },
      data: {
        tenantId,
        result: QualityCheckResult.PASSED,
        approvedById,
        approvedAt: new Date(),
      },
      include: CHECK_INCLUDE,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.qualityCheck.delete({ where: { id } });
  }

  async addRework(tenantId: string, checkId: string, dto: AddReworkDto) {
    return this.prisma.reworkRecord.create({
      data: { qualityCheckId: checkId, ...dto },
    });
  }

  async updateRework(tenantId: string, reworkId: string, dto: UpdateReworkDto) {
    const now = new Date();
    return this.prisma.reworkRecord.update({
      where: { id: reworkId },
      data: {
        ...dto,
        ...(dto.status === 'IN_PROGRESS' && { startedAt: now }),
        ...(dto.status === 'COMPLETED' && { completedAt: now }),
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, passed, failed, conditional] = await Promise.all([
      this.prisma.qualityCheck.count({ where: { tenantId } }),
      this.prisma.qualityCheck.count({ where: { tenantId, result: QualityCheckResult.PASSED } }),
      this.prisma.qualityCheck.count({ where: { tenantId, result: QualityCheckResult.FAILED } }),
      this.prisma.qualityCheck.count({ where: { tenantId, result: QualityCheckResult.CONDITIONAL_PASS } }),
    ]);

    const agg = await this.prisma.qualityCheck.aggregate({
      where: { tenantId },
      _sum: { inspectedQty: true, passedQty: true, failedQty: true, reworkQty: true },
    });

    const defectsBySeverity = await this.prisma.defectRecord.groupBy({
      by: ['severity'],
      where: { qualityCheck: { tenantId } },
      _sum: { quantity: true },
    });

    return {
      totalChecks: total,
      passed,
      failed,
      conditionalPass: conditional,
      totalInspected: agg._sum.inspectedQty ?? 0,
      totalPassed: agg._sum.passedQty ?? 0,
      totalFailed: agg._sum.failedQty ?? 0,
      totalRework: agg._sum.reworkQty ?? 0,
      defectsBySeverity: defectsBySeverity.reduce(
        (acc, row) => {
          acc[row.severity as DefectSeverity] = row._sum.quantity ?? 0;
          return acc;
        },
        {} as Record<DefectSeverity, number>,
      ),
    };
  }
}
