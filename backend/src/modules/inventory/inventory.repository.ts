import { Injectable } from '@nestjs/common';
import { Prisma, InventoryItem, WarehouseStock, StockMovement } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findByCode(code: string, tenantId: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findFirst({
      where: { code, tenantId, deletedAt: null },
    });
  }

  async findMany(
    tenantId: string,
    params: {
      skip: number;
      take: number;
      where?: Prisma.InventoryItemWhereInput;
      orderBy?: Prisma.InventoryItemOrderByWithRelationInput;
    },
  ): Promise<[InventoryItem[], number]> {
    const { skip, take, where, orderBy } = params;
    const baseWhere: Prisma.InventoryItemWhereInput = { tenantId, deletedAt: null, ...where };

    return this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where: baseWhere,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: {
          warehouseStock: {
            include: { warehouse: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      this.prisma.inventoryItem.count({ where: baseWhere }),
    ]);
  }

  async findLowStock(tenantId: string): Promise<InventoryItem[]> {
    return this.prisma.$queryRaw<InventoryItem[]>`
      SELECT i.*
      FROM inventory_items i
      LEFT JOIN (
        SELECT inventoryItemId, SUM(quantity) as totalQty
        FROM warehouse_stock
        GROUP BY inventoryItemId
      ) s ON s.inventoryItemId = i.id
      WHERE i.tenantId = ${tenantId}
        AND i.deletedAt IS NULL
        AND i.isActive = true
        AND i.reorderLevel > 0
        AND COALESCE(s.totalQty, 0) <= i.reorderLevel
      ORDER BY i.name ASC
    `;
  }

  async create(data: Prisma.InventoryItemCreateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.create({ data });
  }

  async update(id: string, data: Prisma.InventoryItemUpdateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<InventoryItem> {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Stock ─────────────────────────────────────────────────────────────────────

  async getStockByItem(inventoryItemId: string): Promise<WarehouseStock[]> {
    return this.prisma.warehouseStock.findMany({
      where: { inventoryItemId },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
  }

  async getOrCreateWarehouseStock(
    warehouseId: string,
    inventoryItemId: string,
  ): Promise<WarehouseStock> {
    return this.prisma.warehouseStock.upsert({
      where: { warehouseId_inventoryItemId: { warehouseId, inventoryItemId } },
      create: { warehouseId, inventoryItemId, quantity: 0, reservedQty: 0, avgCostPerUnit: 0 },
      update: {},
    });
  }

  async updateWarehouseStock(
    warehouseId: string,
    inventoryItemId: string,
    quantityDelta: number,
    newAvgCost?: number,
  ): Promise<WarehouseStock> {
    const stock = await this.getOrCreateWarehouseStock(warehouseId, inventoryItemId);

    const updateData: Prisma.WarehouseStockUpdateInput = {
      quantity: { increment: quantityDelta },
    };

    if (newAvgCost !== undefined && newAvgCost > 0) {
      const currentQty = Number(stock.quantity);
      const incomingQty = quantityDelta > 0 ? quantityDelta : 0;
      const totalQty = currentQty + incomingQty;
      if (totalQty > 0) {
        const weightedAvg =
          (currentQty * Number(stock.avgCostPerUnit) + incomingQty * newAvgCost) / totalQty;
        updateData.avgCostPerUnit = weightedAvg;
      }
    }

    return this.prisma.warehouseStock.update({
      where: { warehouseId_inventoryItemId: { warehouseId, inventoryItemId } },
      data: updateData,
    });
  }

  async createMovement(data: Prisma.StockMovementCreateInput): Promise<StockMovement> {
    return this.prisma.stockMovement.create({ data });
  }

  async findMovements(
    tenantId: string,
    inventoryItemId: string,
    params: {
      skip: number;
      take: number;
      where?: Prisma.StockMovementWhereInput;
    },
  ): Promise<[StockMovement[], number]> {
    const baseWhere: Prisma.StockMovementWhereInput = {
      tenantId,
      inventoryItemId,
      ...params.where,
    };

    return this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: baseWhere,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where: baseWhere }),
    ]);
  }

  async getTotalStock(inventoryItemId: string): Promise<number> {
    const result = await this.prisma.warehouseStock.aggregate({
      where: { inventoryItemId },
      _sum: { quantity: true },
    });
    return Number(result._sum.quantity ?? 0);
  }
}
