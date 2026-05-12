import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CostingRepository } from './costing.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import {
  CreateCostingConfigDto,
  UpdateCostingConfigDto,
  CreateCalculationDto,
  UpdateCalculationDto,
  QueryCalculationsDto,
  RecordWastageDto,
} from './dto';

@Injectable()
export class CostingService {
  constructor(
    private readonly repo: CostingRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Configs ─────────────────────────────────────────────────────────────────

  async getConfigs(tenantId: string) {
    const configs = await this.repo.findManyConfigs(tenantId);
    return buildApiResponse(configs);
  }

  async createConfig(tenantId: string, dto: CreateCostingConfigDto) {
    if (dto.isDefault) {
      await this.repo.updateConfig('__UNSET_DEFAULT__', {}).catch(() => null);
      const existing = await this.repo.findDefaultConfig(tenantId, dto.garmentTypeId ?? undefined);
      if (existing) {
        await this.repo.updateConfig(existing.id, { isDefault: false });
      }
    }

    const config = await this.repo.createConfig({
      tenant: { connect: { id: tenantId } },
      ...(dto.garmentTypeId && { garmentType: { connect: { id: dto.garmentTypeId } } }),
      name: dto.name,
      laborCostPerPcs: dto.laborCostPerPcs,
      overheadPercent: dto.overheadPercent,
      profitMarginPct: dto.profitMarginPct,
      wastageMinPct: dto.wastageMinPct,
      wastageMaxPct: dto.wastageMaxPct,
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
    });
    return buildApiResponse(config, 'Config created');
  }

  async updateConfig(id: string, tenantId: string, dto: UpdateCostingConfigDto) {
    const config = await this.repo.findConfigById(id, tenantId);
    if (!config) throw new NotFoundException(`Costing config ${id} not found`);

    if (dto.isDefault === true && !config.isDefault) {
      const existing = await this.repo.findDefaultConfig(tenantId, dto.garmentTypeId ?? config.garmentTypeId ?? undefined);
      if (existing && existing.id !== id) {
        await this.repo.updateConfig(existing.id, { isDefault: false });
      }
    }

    const updated = await this.repo.updateConfig(id, {
      ...(dto.name             !== undefined && { name: dto.name }),
      ...(dto.laborCostPerPcs  !== undefined && { laborCostPerPcs: dto.laborCostPerPcs }),
      ...(dto.overheadPercent  !== undefined && { overheadPercent: dto.overheadPercent }),
      ...(dto.profitMarginPct  !== undefined && { profitMarginPct: dto.profitMarginPct }),
      ...(dto.wastageMinPct    !== undefined && { wastageMinPct: dto.wastageMinPct }),
      ...(dto.wastageMaxPct    !== undefined && { wastageMaxPct: dto.wastageMaxPct }),
      ...(dto.isDefault        !== undefined && { isDefault: dto.isDefault }),
      ...(dto.isActive         !== undefined && { isActive: dto.isActive }),
      ...(dto.garmentTypeId !== undefined && {
        garmentType: dto.garmentTypeId
          ? { connect: { id: dto.garmentTypeId } }
          : { disconnect: true },
      }),
    });
    return buildApiResponse(updated, 'Config updated');
  }

  async deleteConfig(id: string, tenantId: string) {
    const config = await this.repo.findConfigById(id, tenantId);
    if (!config) throw new NotFoundException(`Costing config ${id} not found`);
    await this.repo.deleteConfig(id);
    return buildApiResponse(null, 'Config deleted');
  }

  // ── Calculations ─────────────────────────────────────────────────────────────

  async getCalculations(tenantId: string, query: QueryCalculationsDto) {
    return this.repo.findManyCalculations(tenantId, query);
  }

  async getCalculation(id: string, tenantId: string) {
    const calc = await this.repo.findCalculationById(id, tenantId);
    if (!calc) throw new NotFoundException(`Costing calculation ${id} not found`);
    return buildApiResponse(calc);
  }

  async calculate(tenantId: string, dto: CreateCalculationDto, userId?: string) {
    const existing = await this.repo.findByProductionOrder(dto.productionOrderId);
    if (existing) {
      throw new ConflictException(
        `A cost calculation already exists for order ${dto.productionOrderId}. Update or delete it first.`,
      );
    }

    const order = await this.prisma.productionOrder.findFirst({
      where: { id: dto.productionOrderId, tenantId },
      include: {
        garmentType: {
          include: {
            garmentAccessories: {
              include: {
                inventoryItem: {
                  select: { id: true, code: true, name: true, unit: true, type: true, costPerUnit: true },
                },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException(`Production order ${dto.productionOrderId} not found`);

    let config = dto.costingConfigId
      ? await this.repo.findConfigById(dto.costingConfigId, tenantId)
      : await this.repo.findDefaultConfig(tenantId, order.garmentTypeId ?? undefined);

    if (!config) {
      throw new NotFoundException(
        'No costing config found. Create a default config first.',
      );
    }

    const bom = order.garmentType?.garmentAccessories ?? [];
    const plannedQty = order.plannedQty;

    const wastageRate = (Number(config.wastageMinPct) + Number(config.wastageMaxPct)) / 2 / 100;

    let totalFabricCost = 0;
    let totalAccessoryCost = 0;
    let totalWastageCost = 0;

    const lines: Array<{
      inventoryItemId: string;
      lineType: string;
      quantity: number;
      unitCost: number;
      wastagePercent: number;
      wastageQty: number;
      totalCost: number;
      notes?: string;
    }> = [];

    for (const bom of order.garmentType?.garmentAccessories ?? []) {
      const unitCost = Number(bom.inventoryItem.costPerUnit);
      const qtyPerPiece = Number(bom.quantity);
      const rawQty = qtyPerPiece * plannedQty;
      const wastageQty = rawQty * wastageRate;
      const totalQty = rawQty + wastageQty;
      const lineCost = totalQty * unitCost;
      const wastageCost = wastageQty * unitCost;

      const lineType = ['FABRIC'].includes(bom.inventoryItem.type) ? 'FABRIC' : bom.inventoryItem.type;

      if (bom.inventoryItem.type === 'FABRIC') {
        totalFabricCost += lineCost;
      } else {
        totalAccessoryCost += lineCost;
      }
      totalWastageCost += wastageCost;

      lines.push({
        inventoryItemId: bom.inventoryItemId,
        lineType,
        quantity: rawQty,
        unitCost,
        wastagePercent: wastageRate * 100,
        wastageQty,
        totalCost: lineCost,
        notes: bom.notes ?? undefined,
      });
    }

    const totalLaborCost = Number(config.laborCostPerPcs) * plannedQty;
    const directCost = totalFabricCost + totalAccessoryCost + totalLaborCost;
    const overheadCost = directCost * (Number(config.overheadPercent) / 100);
    const totalCost = directCost + overheadCost;
    const costPerPiece = plannedQty > 0 ? totalCost / plannedQty : 0;
    const profitMarginPct = Number(config.profitMarginPct);
    const sellingPricePerPcs = dto.sellingPricePerPcs ?? costPerPiece * (1 + profitMarginPct / 100);

    const calc = await this.repo.createCalculation(
      {
        tenantId,
        productionOrder: { connect: { id: dto.productionOrderId } },
        ...(dto.costingConfigId && { costingConfig: { connect: { id: dto.costingConfigId } } }),
        totalFabricCost,
        totalAccessoryCost,
        totalLaborCost,
        totalWastageCost,
        overheadCost,
        totalCost,
        costPerPiece,
        sellingPricePerPcs,
        profitMarginPct,
        calculatedById: userId,
        notes: dto.notes,
      },
      lines,
    );

    return buildApiResponse(calc, 'Cost calculation created');
  }

  async updateCalculation(id: string, tenantId: string, dto: UpdateCalculationDto) {
    const calc = await this.repo.findCalculationById(id, tenantId);
    if (!calc) throw new NotFoundException(`Costing calculation ${id} not found`);

    const updated = await this.repo.updateCalculation(id, {
      ...(dto.sellingPricePerPcs !== undefined && { sellingPricePerPcs: dto.sellingPricePerPcs }),
      ...(dto.profitMarginPct    !== undefined && { profitMarginPct: dto.profitMarginPct }),
      ...(dto.notes              !== undefined && { notes: dto.notes }),
    });
    return buildApiResponse(updated, 'Calculation updated');
  }

  async approveCalculation(id: string, tenantId: string, userId: string) {
    const calc = await this.repo.findCalculationById(id, tenantId);
    if (!calc) throw new NotFoundException(`Costing calculation ${id} not found`);
    if (calc.isApproved) throw new ConflictException('Calculation is already approved');

    const approved = await this.repo.approveCalculation(id, userId);
    return buildApiResponse(approved, 'Calculation approved');
  }

  // ── Wastage ──────────────────────────────────────────────────────────────────

  async getWastage(batchId: string, tenantId: string) {
    const records = await this.repo.findWastageByBatch(batchId, tenantId);
    return buildApiResponse(records);
  }

  async recordWastage(tenantId: string, dto: RecordWastageDto, userId?: string) {
    const record = await this.repo.createWastage({
      tenantId,
      batch: { connect: { id: dto.batchId } },
      ...(dto.inventoryItemId && { inventoryItemId: dto.inventoryItemId }),
      wastageType: dto.wastageType,
      quantity: dto.quantity,
      wastagePercent: dto.wastagePercent,
      isThresholdExceeded: dto.isThresholdExceeded ?? false,
      reason: dto.reason,
      recordedById: userId,
    });
    return buildApiResponse(record, 'Wastage recorded');
  }
}
