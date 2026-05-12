import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFinishedGoodDto } from './dto/create-finished-good.dto';
import { UpdateFinishedGoodDto } from './dto/update-finished-good.dto';
import { StockAdjustmentType } from './dto/adjust-stock.dto';

@Injectable()
export class FinishedGoodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    tenantId: string,
    params: {
      search?: string;
      category?: string;
      color?: string;
      size?: string;
      isActive?: boolean;
      page: number;
      limit: number;
    },
  ) {
    const { search, category, color, size, isActive, page, limit } = params;
    const where: Prisma.FinishedGoodWhereInput = {
      tenantId,
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(category && { category }),
      ...(color && { color }),
      ...(size && { size }),
      ...(search && {
        OR: [
          { sku: { contains: search } },
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.finishedGood.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.finishedGood.count({ where }),
    ]);

    return { data, total };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.finishedGood.findFirst({ where: { id, tenantId } });
  }

  async create(tenantId: string, dto: CreateFinishedGoodDto) {
    return this.prisma.finishedGood.create({
      data: { tenantId, ...dto },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateFinishedGoodDto) {
    return this.prisma.finishedGood.update({
      where: { id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.finishedGood.delete({ where: { id } });
  }

  async adjustStock(tenantId: string, id: string, type: StockAdjustmentType, quantity: number) {
    return this.prisma.finishedGood.update({
      where: { id },
      data: {
        quantity:
          type === StockAdjustmentType.IN
            ? { increment: quantity }
            : { decrement: quantity },
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, agg] = await Promise.all([
      this.prisma.finishedGood.count({ where: { tenantId } }),
      this.prisma.finishedGood.count({ where: { tenantId, isActive: true } }),
      this.prisma.finishedGood.aggregate({
        where: { tenantId },
        _sum: { quantity: true },
        _avg: { sellingPrice: true },
      }),
    ]);

    const readyToDispatch = await this.prisma.finishedGood.count({
      where: { tenantId, isActive: true, quantity: { gt: 0 } },
    });

    return {
      totalSkus: total,
      activeSkus: active,
      totalUnitsInStock: agg._sum.quantity ?? 0,
      avgSellingPrice: Number(agg._avg.sellingPrice ?? 0),
      readyToDispatch,
    };
  }
}
