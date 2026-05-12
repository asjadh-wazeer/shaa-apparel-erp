import { Injectable, Logger } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  QueryInventoryItemsDto,
  CreateStockMovementDto,
  QueryMovementsDto,
} from './dto';
import { buildApiResponse, buildPaginatedResponse } from '../../common/utils';
import {
  DuplicateRecordException,
  ResourceNotFoundException,
  InsufficientStockException,
} from '../../common/exceptions';

const OUTBOUND_TYPES: StockMovementType[] = [
  StockMovementType.PRODUCTION_ISSUED,
  StockMovementType.ADJUSTMENT_OUT,
  StockMovementType.TRANSFER_OUT,
  StockMovementType.WASTAGE,
  StockMovementType.SALE,
];

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async create(tenantId: string, dto: CreateInventoryItemDto): Promise<unknown> {
    const existing = await this.inventoryRepository.findByCode(dto.code, tenantId);
    if (existing) throw new DuplicateRecordException('code');

    const item = await this.inventoryRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      unit: dto.unit,
      reorderLevel: dto.reorderLevel ?? 0,
      reorderQuantity: dto.reorderQuantity ?? 0,
      costPerUnit: dto.costPerUnit ?? 0,
      barcode: dto.barcode,
      isActive: dto.isActive ?? true,
      tenant: { connect: { id: tenantId } },
    });

    return buildApiResponse(item, 'Inventory item created successfully');
  }

  async findAll(tenantId: string, query: QueryInventoryItemsDto): Promise<unknown> {
    const where: Prisma.InventoryItemWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
        { barcode: { contains: query.search } },
      ];
    }

    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: 'desc' };

    const [items, total] = await this.inventoryRepository.findMany(tenantId, {
      skip: query.skip,
      take: query.limit,
      where,
      orderBy,
    });

    return buildPaginatedResponse(items, total, query.page, query.limit);
  }

  async findLowStock(tenantId: string): Promise<unknown> {
    const items = await this.inventoryRepository.findLowStock(tenantId);
    return buildApiResponse(items, 'Low stock items retrieved');
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    const [stockLevels, totalQty] = await Promise.all([
      this.inventoryRepository.getStockByItem(id),
      this.inventoryRepository.getTotalStock(id),
    ]);

    return buildApiResponse({ ...item, stockLevels, totalQty });
  }

  async update(id: string, tenantId: string, dto: UpdateInventoryItemDto): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    if (dto.code && dto.code !== item.code) {
      const conflict = await this.inventoryRepository.findByCode(dto.code, tenantId);
      if (conflict) throw new DuplicateRecordException('code');
    }

    const updated = await this.inventoryRepository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type && { type: dto.type }),
      ...(dto.unit && { unit: dto.unit }),
      ...(dto.reorderLevel !== undefined && { reorderLevel: dto.reorderLevel }),
      ...(dto.reorderQuantity !== undefined && { reorderQuantity: dto.reorderQuantity }),
      ...(dto.costPerUnit !== undefined && { costPerUnit: dto.costPerUnit }),
      ...(dto.barcode !== undefined && { barcode: dto.barcode }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.code && { code: dto.code }),
    });

    return buildApiResponse(updated, 'Inventory item updated successfully');
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    const totalQty = await this.inventoryRepository.getTotalStock(id);
    if (totalQty > 0) {
      throw new Error(`Cannot delete item with stock on hand (${totalQty} ${item.unit})`);
    }

    await this.inventoryRepository.softDelete(id);
    return buildApiResponse(null, 'Inventory item deleted successfully');
  }

  async recordMovement(
    id: string,
    tenantId: string,
    dto: CreateStockMovementDto,
    performedById?: string,
  ): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    const isOutbound = OUTBOUND_TYPES.includes(dto.type);

    if (isOutbound && dto.warehouseId) {
      const stock = await this.inventoryRepository.getOrCreateWarehouseStock(
        dto.warehouseId,
        id,
      );
      const available = Number(stock.quantity) - Number(stock.reservedQty);
      if (available < dto.quantity) {
        throw new InsufficientStockException(item.name, available, dto.quantity);
      }
    }

    const totalCost =
      dto.unitCost != null ? dto.unitCost * dto.quantity : undefined;

    const movement = await this.inventoryRepository.createMovement({
      tenantId,
      type: dto.type,
      quantity: isOutbound ? -dto.quantity : dto.quantity,
      unitCost: dto.unitCost,
      totalCost,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      notes: dto.notes,
      performedById,
      inventoryItem: { connect: { id } },
      ...(dto.warehouseId && { warehouseId: dto.warehouseId }),
    });

    if (dto.warehouseId) {
      const delta = isOutbound ? -dto.quantity : dto.quantity;
      await this.inventoryRepository.updateWarehouseStock(
        dto.warehouseId,
        id,
        delta,
        !isOutbound ? dto.unitCost : undefined,
      );
    }

    this.logger.log(
      `Stock movement [${dto.type}] for item ${id}: qty=${dto.quantity} warehouse=${dto.warehouseId}`,
    );

    return buildApiResponse(movement, 'Stock movement recorded successfully');
  }

  async getMovements(
    id: string,
    tenantId: string,
    query: QueryMovementsDto,
  ): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    const where: Prisma.StockMovementWhereInput = {};
    if (query.type) where.type = query.type;

    const [movements, total] = await this.inventoryRepository.findMovements(
      tenantId,
      id,
      { skip: query.skip, take: query.limit, where },
    );

    return buildPaginatedResponse(movements, total, query.page, query.limit);
  }

  async getStockLevels(id: string, tenantId: string): Promise<unknown> {
    const item = await this.inventoryRepository.findById(id, tenantId);
    if (!item) throw new ResourceNotFoundException('InventoryItem', id);

    const [stockLevels, totalQty] = await Promise.all([
      this.inventoryRepository.getStockByItem(id),
      this.inventoryRepository.getTotalStock(id),
    ]);

    return buildApiResponse({
      item: { id: item.id, code: item.code, name: item.name, unit: item.unit },
      totalQty,
      reorderLevel: Number(item.reorderLevel),
      isLowStock: totalQty <= Number(item.reorderLevel),
      stockLevels,
    });
  }
}
