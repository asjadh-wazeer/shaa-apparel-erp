import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QueryGarmentTypesDto } from './dto';

const TYPE_INCLUDE = {
  garmentAccessories: {
    include: {
      inventoryItem: { select: { id: true, code: true, name: true, unit: true, type: true, costPerUnit: true } },
    },
    orderBy: { inventoryItem: { name: 'asc' } } as Prisma.GarmentAccessoryOrderByWithRelationInput,
  },
  _count: { select: { garmentAccessories: true, productionOrders: true } },
} satisfies Prisma.GarmentTypeInclude;

@Injectable()
export class GarmentTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string) {
    return this.prisma.garmentType.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
      include: TYPE_INCLUDE,
    });
  }

  async findByCode(code: string) {
    return this.prisma.garmentType.findUnique({ where: { code } });
  }

  async findMany(tenantId: string, query: QueryGarmentTypesDto) {
    const { page, limit, skip, search, isActive } = query;

    const where: Prisma.GarmentTypeWhereInput = {
      OR: [{ tenantId }, { tenantId: null }],
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.garmentType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { garmentAccessories: true, productionOrders: true } },
        },
      }),
      this.prisma.garmentType.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async listAll(tenantId: string) {
    return this.prisma.garmentType.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }], isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
  }

  async create(tenantId: string, data: Prisma.GarmentTypeCreateInput) {
    return this.prisma.garmentType.create({
      data: { ...data, tenantId },
      include: TYPE_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.GarmentTypeUpdateInput) {
    return this.prisma.garmentType.update({
      where: { id },
      data,
      include: TYPE_INCLUDE,
    });
  }

  async delete(id: string) {
    return this.prisma.garmentType.delete({ where: { id } });
  }

  // ── Accessories (BOM) ───────────────────────────────────────────────────────

  async findAccessoryById(id: string) {
    return this.prisma.garmentAccessory.findUnique({
      where: { id },
      include: {
        inventoryItem: { select: { id: true, code: true, name: true, unit: true, type: true, costPerUnit: true } },
      },
    });
  }

  async upsertAccessory(
    garmentTypeId: string,
    inventoryItemId: string,
    data: { quantity: number; unit: string; notes?: string },
  ) {
    return this.prisma.garmentAccessory.upsert({
      where: { garmentTypeId_inventoryItemId: { garmentTypeId, inventoryItemId } },
      create: {
        garmentTypeId,
        inventoryItemId,
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes,
      },
      update: {
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes,
      },
      include: {
        inventoryItem: { select: { id: true, code: true, name: true, unit: true, type: true, costPerUnit: true } },
      },
    });
  }

  async updateAccessory(
    id: string,
    data: Partial<{ quantity: number; unit: string; notes: string | null }>,
  ) {
    return this.prisma.garmentAccessory.update({
      where: { id },
      data,
      include: {
        inventoryItem: { select: { id: true, code: true, name: true, unit: true, type: true, costPerUnit: true } },
      },
    });
  }

  async deleteAccessory(id: string) {
    return this.prisma.garmentAccessory.delete({ where: { id } });
  }
}
