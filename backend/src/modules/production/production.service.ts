import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ProductionRepository } from './production.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import {
  CreateProductionOrderDto,
  UpdateProductionOrderDto,
  QueryProductionOrdersDto,
  CreateProductionBatchDto,
  AdvanceStageDto,
} from './dto';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(private readonly repo: ProductionRepository) {}

  async getStageConfigs(tenantId: string): Promise<unknown> {
    const stages = await this.repo.getStageConfigs(tenantId);
    return buildApiResponse(stages);
  }

  async create(tenantId: string, dto: CreateProductionOrderDto, userId: string): Promise<unknown> {
    const orderNumber = dto.orderNumber ?? (await this.repo.generateOrderNumber(tenantId));
    const order = await this.repo.create(tenantId, {
      tenant: { connect: { id: tenantId } },
      orderNumber,
      description: dto.description,
      plannedQty: dto.plannedQty,
      priority: dto.priority ?? 5,
      plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      notes: dto.notes,
      status: 'DRAFT',
      createdById: userId,
      ...(dto.factoryId && { factory: { connect: { id: dto.factoryId } } }),
      ...(dto.garmentTypeId && { garmentType: { connect: { id: dto.garmentTypeId } } }),
    });
    return buildApiResponse(order, 'Production order created');
  }

  async findAll(tenantId: string, query: QueryProductionOrdersDto): Promise<unknown> {
    return this.repo.findMany(tenantId, query);
  }

  async getStats(tenantId: string): Promise<unknown> {
    const stats = await this.repo.getDashboardStats(tenantId);
    return buildApiResponse(stats);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const order = await this.repo.findById(id, tenantId);
    if (!order) throw new NotFoundException(`Production order ${id} not found`);
    return buildApiResponse(order);
  }

  async update(id: string, tenantId: string, dto: UpdateProductionOrderDto): Promise<unknown> {
    const order = await this.repo.findById(id, tenantId);
    if (!order) throw new NotFoundException(`Production order ${id} not found`);

    const updated = await this.repo.update(id, tenantId, {
      ...(dto.orderNumber !== undefined && { orderNumber: dto.orderNumber }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.plannedQty !== undefined && { plannedQty: dto.plannedQty }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status as any }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.plannedStartDate !== undefined && {
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : null,
      }),
      ...(dto.plannedEndDate !== undefined && {
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : null,
      }),
      ...(dto.factoryId !== undefined && {
        factory: dto.factoryId ? { connect: { id: dto.factoryId } } : { disconnect: true },
      }),
    });
    return buildApiResponse(updated, 'Production order updated');
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const order = await this.repo.findById(id, tenantId);
    if (!order) throw new NotFoundException(`Production order ${id} not found`);
    if (order.status === 'IN_PROGRESS') {
      throw new BadRequestException('Cannot delete an in-progress production order');
    }
    await this.repo.softDelete(id, tenantId);
    return buildApiResponse(null, 'Production order deleted');
  }

  async createBatch(
    orderId: string,
    tenantId: string,
    dto: CreateProductionBatchDto,
  ): Promise<unknown> {
    const order = await this.repo.findById(orderId, tenantId);
    if (!order) throw new NotFoundException(`Production order ${orderId} not found`);
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException(`Cannot add batch to a ${order.status} order`);
    }

    const stageConfigs = await this.repo.getStageConfigs(tenantId);
    if (stageConfigs.length === 0) {
      throw new BadRequestException('No production stage configurations found');
    }

    const batchNumber = dto.batchNumber ?? (await this.repo.generateBatchNumber(orderId));
    const batch = await this.repo.createBatch(
      orderId,
      { batchNumber, plannedQty: dto.plannedQty, notes: dto.notes },
      stageConfigs,
    );

    if (order.status === 'DRAFT' || order.status === 'PLANNED') {
      await this.repo.update(orderId, tenantId, {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      });
    }

    return buildApiResponse(batch, 'Production batch created');
  }

  async findBatch(orderId: string, batchId: string, tenantId: string): Promise<unknown> {
    const order = await this.repo.findById(orderId, tenantId);
    if (!order) throw new NotFoundException(`Production order ${orderId} not found`);

    const batch = await this.repo.findBatchById(batchId, orderId);
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);
    return buildApiResponse(batch);
  }

  async advanceStage(
    orderId: string,
    batchId: string,
    tenantId: string,
    dto: AdvanceStageDto,
    userId: string,
  ): Promise<unknown> {
    const order = await this.repo.findById(orderId, tenantId);
    if (!order) throw new NotFoundException(`Production order ${orderId} not found`);

    const batch = await this.repo.findBatchById(batchId, orderId);
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);
    if (batch.status === 'COMPLETED') {
      throw new BadRequestException('Batch is already completed');
    }
    if (batch.status === 'CANCELLED') {
      throw new BadRequestException('Batch has been cancelled');
    }

    const currentHistory = batch.stageHistories.find((h) => h.status === 'IN_PROGRESS');
    if (!currentHistory) {
      throw new BadRequestException('No stage is currently in progress for this batch');
    }

    const allStages = batch.stageHistories
      .map((h) => h.stageConfig)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const currentStageIndex = allStages.findIndex(
      (s) => s.id === currentHistory.stageConfigId,
    );
    const nextStage = allStages[currentStageIndex + 1] ?? null;

    await this.repo.advanceStage(
      batchId,
      currentHistory.id,
      nextStage?.id ?? null,
      {
        completedQty: dto.completedQty,
        rejectedQty: dto.rejectedQty ?? 0,
        actualMinutes: dto.actualMinutes,
        notes: dto.notes,
      },
    );

    if (!nextStage) {
      const activeBatches = await this.repo.countActiveBatchesForOrder(orderId);
      if (activeBatches === 0) {
        await this.repo.update(orderId, tenantId, {
          status: 'COMPLETED',
          actualEndDate: new Date(),
          completedQty: dto.completedQty,
        });
      } else {
        await this.repo.update(orderId, tenantId, { status: 'PARTIALLY_COMPLETED' });
      }
    }

    const updatedBatch = await this.repo.findBatchById(batchId, orderId);
    return buildApiResponse(
      updatedBatch,
      nextStage ? `Advanced to ${nextStage.name}` : 'Batch completed',
    );
  }

  async getBatchesByStage(tenantId: string, stageCodes: string): Promise<unknown> {
    const codes = stageCodes.split(',').map((c) => c.trim().toUpperCase());
    const batches = await this.repo.findBatchesByStage(tenantId, codes);
    return buildApiResponse(batches);
  }
}
