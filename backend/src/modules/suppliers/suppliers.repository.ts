import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, query: QuerySuppliersDto) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { contactName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [suppliers, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { purchaseOrders: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return buildPaginatedResponse(suppliers, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.supplier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    });
  }

  async findByCode(code: string, tenantId: string) {
    return this.prisma.supplier.findFirst({
      where: { code, tenantId, deletedAt: null },
    });
  }

  async create(data: Prisma.SupplierCreateInput) {
    return this.prisma.supplier.create({ data });
  }

  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }
}
