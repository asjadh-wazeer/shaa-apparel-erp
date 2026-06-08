import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FinishedGoodsRepository } from './finished-goods.repository';
import { PosIntegrationService } from '../pos-integration/pos-integration.service';
import { CreateFinishedGoodDto } from './dto/create-finished-good.dto';
import { UpdateFinishedGoodDto } from './dto/update-finished-good.dto';
import { QueryFinishedGoodsDto } from './dto/query-finished-goods.dto';
import { AdjustStockDto, StockAdjustmentType } from './dto/adjust-stock.dto';

@Injectable()
export class FinishedGoodsService {
  constructor(
    private readonly repo: FinishedGoodsRepository,
    private readonly posService: PosIntegrationService,
  ) {}

  async getStats(tenantId: string) {
    return this.repo.getStats(tenantId);
  }

  async findMany(tenantId: string, query: QueryFinishedGoodsDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const { data, total } = await this.repo.findMany(tenantId, {
      search: query.search,
      category: query.category,
      color: query.color,
      size: query.size,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const good = await this.repo.findById(tenantId, id);
    if (!good) throw new NotFoundException(`Finished good ${id} not found`);
    return good;
  }

  async create(tenantId: string, dto: CreateFinishedGoodDto) {
    const good = await this.repo.create(tenantId, dto);
    await this.posService.enqueueSyncIfActive(tenantId);
    return good;
  }

  async update(tenantId: string, id: string, dto: UpdateFinishedGoodDto) {
    await this.findById(tenantId, id);
    const good = await this.repo.update(tenantId, id, dto);
    await this.posService.enqueueSyncIfActive(tenantId);
    return good;
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    const result = await this.repo.delete(tenantId, id);
    await this.posService.enqueueSyncIfActive(tenantId);
    return result;
  }

  async adjustStock(tenantId: string, id: string, dto: AdjustStockDto) {
    const good = await this.findById(tenantId, id);
    if (dto.type === StockAdjustmentType.OUT && good.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${good.quantity}, requested: ${dto.quantity}`,
      );
    }
    const updated = await this.repo.adjustStock(tenantId, id, dto.type, dto.quantity);
    await this.posService.enqueueSyncIfActive(tenantId);
    return updated;
  }
}
