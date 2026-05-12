import { Injectable } from '@nestjs/common';
import { Prisma, Warehouse, WarehouseStock } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Warehouse | null> {
    return this.prisma.warehouse.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findByCode(code: string, tenantId: string): Promise<Warehouse | null> {
    return this.prisma.warehouse.findFirst({
      where: { code, tenantId, deletedAt: null },
    });
  }

  async findMany(
    tenantId: string,
    params: {
      skip: number;
      take: number;
      where?: Prisma.WarehouseWhereInput;
      orderBy?: Prisma.WarehouseOrderByWithRelationInput;
    },
  ): Promise<[Warehouse[], number]> {
    const { skip, take, where, orderBy } = params;
    const baseWhere: Prisma.WarehouseWhereInput = { tenantId, deletedAt: null, ...where };

    return this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where: baseWhere,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { factory: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.warehouse.count({ where: baseWhere }),
    ]);
  }

  async create(data: Prisma.WarehouseCreateInput): Promise<Warehouse> {
    return this.prisma.warehouse.create({ data });
  }

  async update(id: string, data: Prisma.WarehouseUpdateInput): Promise<Warehouse> {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Warehouse> {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async clearDefaultForTenant(tenantId: string): Promise<void> {
    await this.prisma.warehouse.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async getStock(
    warehouseId: string,
    params: {
      skip: number;
      take: number;
      where?: Prisma.WarehouseStockWhereInput;
    },
  ): Promise<[WarehouseStock[], number]> {
    const baseWhere: Prisma.WarehouseStockWhereInput = {
      warehouseId,
      ...params.where,
    };

    return this.prisma.$transaction([
      this.prisma.warehouseStock.findMany({
        where: baseWhere,
        skip: params.skip,
        take: params.take,
        include: {
          inventoryItem: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              unit: true,
              reorderLevel: true,
              isActive: true,
            },
          },
        },
        orderBy: { inventoryItem: { name: 'asc' } },
      }),
      this.prisma.warehouseStock.count({ where: baseWhere }),
    ]);
  }

  async getStockSummary(warehouseId: string): Promise<{
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
  }> {
    const stocks = await this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { inventoryItem: { select: { reorderLevel: true, isActive: true } } },
    });

    const totalItems = stocks.length;
    const lowStockCount = stocks.filter(
      (s) => Number(s.quantity) <= Number(s.inventoryItem.reorderLevel),
    ).length;
    const totalValue = stocks.reduce(
      (acc, s) => acc + Number(s.quantity) * Number(s.avgCostPerUnit),
      0,
    );

    return { totalItems, lowStockCount, totalValue };
  }
}
