import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, SaleChannel, SaleStatus } from '@prisma/client';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { UpsertPosConfigDto } from './dto/upsert-pos-config.dto';

const SALE_INCLUDE = {
  finishedGood: { select: { id: true, sku: true, name: true, category: true } },
} satisfies Prisma.SaleRecordInclude;

@Injectable()
export class PosIntegrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Sales ──────────────────────────────────────────────────────────────────

  async findManySales(
    tenantId: string,
    params: {
      dateFrom?: string;
      dateTo?: string;
      channel?: SaleChannel;
      status?: SaleStatus;
      search?: string;
      page: number;
      limit: number;
    },
  ) {
    const { dateFrom, dateTo, channel, status, search, page, limit } = params;
    const where: Prisma.SaleRecordWhereInput = {
      tenantId,
      ...(channel && { channel }),
      ...(status && { status }),
      ...((dateFrom || dateTo) && {
        saleDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
      ...(search && {
        OR: [
          { saleNumber: { contains: search } },
          { customerName: { contains: search } },
          { finishedGood: { name: { contains: search } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.saleRecord.findMany({
        where,
        include: SALE_INCLUDE,
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.saleRecord.count({ where }),
    ]);

    return { data, total };
  }

  async findSaleById(tenantId: string, id: string) {
    return this.prisma.saleRecord.findFirst({
      where: { id, tenantId },
      include: SALE_INCLUDE,
    });
  }

  async createSale(tenantId: string, saleNumber: string, dto: CreateSaleDto) {
    const totalAmount = dto.quantity * dto.unitPrice;
    return this.prisma.$transaction(async (tx) => {
      const good = await tx.finishedGood.findFirst({
        where: { id: dto.finishedGoodId, tenantId },
      });
      if (!good) throw new Error('Finished good not found');
      if (good.quantity < dto.quantity) {
        throw new Error(`Insufficient stock. Available: ${good.quantity}, requested: ${dto.quantity}`);
      }

      const [sale] = await Promise.all([
        tx.saleRecord.create({
          data: {
            tenantId,
            saleNumber,
            finishedGoodId: dto.finishedGoodId,
            quantity: dto.quantity,
            unitPrice: dto.unitPrice,
            totalAmount,
            customerName: dto.customerName,
            channel: dto.channel ?? 'POS',
            status: dto.status ?? 'COMPLETED',
            notes: dto.notes,
            saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
          },
          include: SALE_INCLUDE,
        }),
        tx.finishedGood.update({
          where: { id: dto.finishedGoodId },
          data: { quantity: { decrement: dto.quantity } },
        }),
      ]);

      return sale;
    });
  }

  async updateSale(tenantId: string, id: string, dto: UpdateSaleDto) {
    return this.prisma.saleRecord.update({
      where: { id },
      data: dto,
      include: SALE_INCLUDE,
    });
  }

  async deleteSale(tenantId: string, id: string) {
    return this.prisma.saleRecord.delete({ where: { id } });
  }

  async getSalesStats(tenantId: string) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [todayAgg, monthAgg, totalAgg, byChannel] = await Promise.all([
      this.prisma.saleRecord.aggregate({
        where: { tenantId, saleDate: { gte: todayStart } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      this.prisma.saleRecord.aggregate({
        where: { tenantId, saleDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      this.prisma.saleRecord.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      this.prisma.saleRecord.groupBy({
        by: ['channel'],
        where: { tenantId, saleDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const monthTotal = Number(monthAgg._sum.totalAmount ?? 0);
    const monthCount = monthAgg._count.id;

    return {
      todayRevenue: Number(todayAgg._sum.totalAmount ?? 0),
      todaySales: todayAgg._count.id,
      monthRevenue: monthTotal,
      monthSales: monthCount,
      monthUnitsSold: monthAgg._sum.quantity ?? 0,
      avgOrderValue: monthCount > 0 ? monthTotal / monthCount : 0,
      totalRevenue: Number(totalAgg._sum.totalAmount ?? 0),
      totalSales: totalAgg._count.id,
      byChannel: byChannel.map((r) => ({
        channel: r.channel,
        revenue: Number(r._sum.totalAmount ?? 0),
        count: r._count.id,
      })),
    };
  }

  async nextSaleNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.saleRecord.count({ where: { tenantId } });
    return `SL-${String(count + 1).padStart(4, '0')}`;
  }

  // ── POS Config ─────────────────────────────────────────────────────────────

  async getPosConfig(tenantId: string) {
    return this.prisma.posConfig.findUnique({ where: { tenantId } });
  }

  async upsertPosConfig(tenantId: string, dto: UpsertPosConfigDto) {
    const data = {
      posSystemName: dto.posSystemName,
      apiEndpoint: dto.apiEndpoint,
      ...(dto.apiKey && { apiKeyHash: dto.apiKey }),
      syncIntervalMin: dto.syncIntervalMin ?? 30,
      isActive: dto.isActive ?? true,
      fieldMappings: {},
    };
    return this.prisma.posConfig.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  // ── Catalog (finished goods available for sale) ────────────────────────────

  async getCatalog(tenantId: string) {
    return this.prisma.finishedGood.findMany({
      where: { tenantId, isActive: true, quantity: { gt: 0 } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        color: true,
        size: true,
        quantity: true,
        sellingPrice: true,
      },
    });
  }
}
