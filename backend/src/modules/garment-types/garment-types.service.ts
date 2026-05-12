import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { GarmentTypesRepository } from './garment-types.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import {
  CreateGarmentTypeDto,
  UpdateGarmentTypeDto,
  QueryGarmentTypesDto,
  CreateAccessoryDto,
  UpdateAccessoryDto,
} from './dto';

@Injectable()
export class GarmentTypesService {
  constructor(private readonly repo: GarmentTypesRepository) {}

  async create(tenantId: string, dto: CreateGarmentTypeDto) {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException(`Garment type code "${dto.code}" already exists`);

    const type = await this.repo.create(tenantId, {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });
    return buildApiResponse(type, 'Garment type created');
  }

  async findAll(tenantId: string, query: QueryGarmentTypesDto) {
    return this.repo.findMany(tenantId, query);
  }

  async listAll(tenantId: string) {
    const types = await this.repo.listAll(tenantId);
    return buildApiResponse(types);
  }

  async findOne(id: string, tenantId: string) {
    const type = await this.repo.findById(id, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${id} not found`);
    return buildApiResponse(type);
  }

  async update(id: string, tenantId: string, dto: UpdateGarmentTypeDto) {
    const type = await this.repo.findById(id, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${id} not found`);

    if (dto.code && dto.code !== type.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing) throw new ConflictException(`Garment type code "${dto.code}" already exists`);
    }

    const updated = await this.repo.update(id, {
      ...(dto.code        !== undefined && { code: dto.code }),
      ...(dto.name        !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive    !== undefined && { isActive: dto.isActive }),
    });
    return buildApiResponse(updated, 'Garment type updated');
  }

  async remove(id: string, tenantId: string) {
    const type = await this.repo.findById(id, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${id} not found`);
    await this.repo.delete(id);
    return buildApiResponse(null, 'Garment type deleted');
  }

  // ── Accessories (BOM) ───────────────────────────────────────────────────────

  async addAccessory(id: string, tenantId: string, dto: CreateAccessoryDto) {
    const type = await this.repo.findById(id, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${id} not found`);

    const accessory = await this.repo.upsertAccessory(id, dto.inventoryItemId, {
      quantity: dto.quantity,
      unit: dto.unit,
      notes: dto.notes,
    });
    return buildApiResponse(accessory, 'BOM item added');
  }

  async updateAccessory(
    garmentTypeId: string,
    accessoryId: string,
    tenantId: string,
    dto: UpdateAccessoryDto,
  ) {
    const type = await this.repo.findById(garmentTypeId, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${garmentTypeId} not found`);

    const accessory = await this.repo.findAccessoryById(accessoryId);
    if (!accessory || accessory.garmentTypeId !== garmentTypeId) {
      throw new NotFoundException(`BOM item ${accessoryId} not found`);
    }

    const updated = await this.repo.updateAccessory(accessoryId, {
      ...(dto.quantity !== undefined && { quantity: dto.quantity }),
      ...(dto.unit     !== undefined && { unit: dto.unit }),
      ...(dto.notes    !== undefined && { notes: dto.notes ?? null }),
    });
    return buildApiResponse(updated, 'BOM item updated');
  }

  async removeAccessory(garmentTypeId: string, accessoryId: string, tenantId: string) {
    const type = await this.repo.findById(garmentTypeId, tenantId);
    if (!type) throw new NotFoundException(`Garment type ${garmentTypeId} not found`);

    const accessory = await this.repo.findAccessoryById(accessoryId);
    if (!accessory || accessory.garmentTypeId !== garmentTypeId) {
      throw new NotFoundException(`BOM item ${accessoryId} not found`);
    }

    await this.repo.deleteAccessory(accessoryId);
    return buildApiResponse(null, 'BOM item removed');
  }
}
