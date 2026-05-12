import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarehousesRepository } from './warehouses.repository';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehousesDto,
  QueryWarehouseStockDto,
} from './dto';
import { buildApiResponse, buildPaginatedResponse } from '../../common/utils';
import { DuplicateRecordException, ResourceNotFoundException } from '../../common/exceptions';

@Injectable()
export class WarehousesService {
  constructor(private readonly warehousesRepository: WarehousesRepository) {}

  async create(tenantId: string, dto: CreateWarehouseDto): Promise<unknown> {
    const existing = await this.warehousesRepository.findByCode(dto.code, tenantId);
    if (existing) throw new DuplicateRecordException('code');

    if (dto.isDefault) {
      await this.warehousesRepository.clearDefaultForTenant(tenantId);
    }

    const warehouse = await this.warehousesRepository.create({
      name: dto.name,
      code: dto.code,
      location: dto.location,
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
      tenant: { connect: { id: tenantId } },
      ...(dto.factoryId && { factory: { connect: { id: dto.factoryId } } }),
    });

    return buildApiResponse(warehouse, 'Warehouse created successfully');
  }

  async findAll(tenantId: string, query: QueryWarehousesDto): Promise<unknown> {
    const where: Prisma.WarehouseWhereInput = {};

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
        { location: { contains: query.search } },
      ];
    }

    const orderBy: Prisma.WarehouseOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: 'desc' };

    const [warehouses, total] = await this.warehousesRepository.findMany(tenantId, {
      skip: query.skip,
      take: query.limit,
      where,
      orderBy,
    });

    return buildPaginatedResponse(warehouses, total, query.page, query.limit);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const warehouse = await this.warehousesRepository.findById(id, tenantId);
    if (!warehouse) throw new ResourceNotFoundException('Warehouse', id);

    const summary = await this.warehousesRepository.getStockSummary(id);
    return buildApiResponse({ ...warehouse, ...summary });
  }

  async update(id: string, tenantId: string, dto: UpdateWarehouseDto): Promise<unknown> {
    const warehouse = await this.warehousesRepository.findById(id, tenantId);
    if (!warehouse) throw new ResourceNotFoundException('Warehouse', id);

    if (dto.code && dto.code !== warehouse.code) {
      const conflict = await this.warehousesRepository.findByCode(dto.code, tenantId);
      if (conflict) throw new DuplicateRecordException('code');
    }

    if (dto.isDefault) {
      await this.warehousesRepository.clearDefaultForTenant(tenantId);
    }

    const updated = await this.warehousesRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.code && { code: dto.code }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.factoryId !== undefined && {
        factory: dto.factoryId ? { connect: { id: dto.factoryId } } : { disconnect: true },
      }),
    });

    return buildApiResponse(updated, 'Warehouse updated successfully');
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const warehouse = await this.warehousesRepository.findById(id, tenantId);
    if (!warehouse) throw new ResourceNotFoundException('Warehouse', id);

    const summary = await this.warehousesRepository.getStockSummary(id);
    if (summary.totalItems > 0) {
      throw new Error('Cannot delete a warehouse that still holds stock');
    }

    await this.warehousesRepository.softDelete(id);
    return buildApiResponse(null, 'Warehouse deleted successfully');
  }

  async getStock(
    id: string,
    tenantId: string,
    query: QueryWarehouseStockDto,
  ): Promise<unknown> {
    const warehouse = await this.warehousesRepository.findById(id, tenantId);
    if (!warehouse) throw new ResourceNotFoundException('Warehouse', id);

    const where: Prisma.WarehouseStockWhereInput = {};
    if (query.type) {
      where.inventoryItem = { type: query.type };
    }

    const [stock, total] = await this.warehousesRepository.getStock(id, {
      skip: query.skip,
      take: query.limit,
      where,
    });

    return buildPaginatedResponse(stock, total, query.page, query.limit);
  }
}
