import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QueryPurchaseOrdersDto } from './dto/query-purchase-orders.dto';
import { Prisma } from '@prisma/client';

const PO_INCLUDE = {
  supplier: { select: { id: true, name: true, code: true, email: true, phone: true } },
  items: {
    include: {
      inventoryItem: { select: { id: true, code: true, name: true, unit: true } },
    },
  },
  grns: {
    include: {
      items: {
        include: {
          inventoryItem: { select: { id: true, code: true, name: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchaseOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, query: QueryPurchaseOrdersDto) {
    const { page, limit, search, status, supplierId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
      deletedAt: null,
      ...(status     && { status: status as any }),
      ...(supplierId && { supplierId }),
      ...(search && {
        OR: [
          { poNumber: { contains: search } },
          { supplier: { name: { contains: search } } },
        ],
      }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          items: { select: { id: true, orderedQty: true, receivedQty: true, unitPrice: true, totalPrice: true } },
          _count: { select: { grns: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return buildPaginatedResponse(orders, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: PO_INCLUDE,
    });
  }

  async findByPoNumber(poNumber: string, tenantId: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { poNumber, tenantId, deletedAt: null },
    });
  }

  async create(data: {
    tenantId: string;
    supplierId: string;
    poNumber: string;
    orderDate: Date;
    expectedDate?: Date;
    notes?: string;
    totalAmount: number;
    createdById: string;
    items: Array<{
      inventoryItemId: string;
      orderedQty: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
    }>;
  }) {
    return this.prisma.purchaseOrder.create({
      data: {
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        poNumber: data.poNumber,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate,
        notes: data.notes,
        totalAmount: data.totalAmount,
        status: 'DRAFT',
        createdById: data.createdById,
        items: {
          create: data.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        },
      },
      include: PO_INCLUDE,
    });
  }

  async updateStatus(id: string, status: string, extra?: Prisma.PurchaseOrderUpdateInput) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any, ...extra },
    });
  }

  async update(id: string, data: Prisma.PurchaseOrderUpdateInput) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: PO_INCLUDE,
    });
  }

  async softDelete(id: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  async generatePoNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    return `PO-${String(count + 1).padStart(4, '0')}`;
  }

  async generateGrnNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.goodsReceivedNote.count({ where: { tenantId } });
    return `GRN-${String(count + 1).padStart(4, '0')}`;
  }

  async createGrn(data: {
    tenantId: string;
    purchaseOrderId: string;
    grnNumber: string;
    warehouseId: string;
    receivedDate: Date;
    notes?: string;
    receivedById: string;
    items: Array<{
      inventoryItemId: string;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unitCost: number;
      notes?: string;
    }>;
  }) {
    return this.prisma.goodsReceivedNote.create({
      data: {
        tenantId: data.tenantId,
        purchaseOrderId: data.purchaseOrderId,
        grnNumber: data.grnNumber,
        warehouseId: data.warehouseId,
        receivedDate: data.receivedDate,
        notes: data.notes,
        receivedById: data.receivedById,
        status: 'DRAFT',
        items: {
          create: data.items.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            receivedQty: i.receivedQty,
            acceptedQty: i.acceptedQty,
            rejectedQty: i.rejectedQty,
            unitCost: i.unitCost,
            notes: i.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });
  }

  async findGrnById(grnId: string, purchaseOrderId: string) {
    return this.prisma.goodsReceivedNote.findFirst({
      where: { id: grnId, purchaseOrderId },
      include: {
        items: {
          include: {
            inventoryItem: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });
  }

  async confirmGrn(grnId: string, confirmedById: string) {
    return this.prisma.goodsReceivedNote.update({
      where: { id: grnId },
      data: {
        status: 'CONFIRMED',
        confirmedById,
        confirmedAt: new Date(),
      },
    });
  }

  async incrementPoItemReceived(purchaseOrderId: string, inventoryItemId: string, qty: number) {
    return this.prisma.purchaseOrderItem.updateMany({
      where: { purchaseOrderId, inventoryItemId },
      data: { receivedQty: { increment: qty } },
    });
  }

  async getPoReceiptStatus(purchaseOrderId: string) {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
      select: { orderedQty: true, receivedQty: true },
    });
    const allFull = items.every((i) => Number(i.receivedQty) >= Number(i.orderedQty));
    const anyReceived = items.some((i) => Number(i.receivedQty) > 0);
    return { allFull, anyReceived };
  }

  async getDashboardStats(tenantId: string) {
    const [total, draft, submitted, approved, partiallyReceived, fullyReceived] =
      await this.prisma.$transaction([
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null } }),
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null, status: 'DRAFT' } }),
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null, status: 'SUBMITTED' } }),
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null, status: 'APPROVED' } }),
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null, status: 'PARTIALLY_RECEIVED' } }),
        this.prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null, status: 'FULLY_RECEIVED' } }),
      ]);
    return { total, draft, submitted, approved, partiallyReceived, fullyReceived };
  }
}
