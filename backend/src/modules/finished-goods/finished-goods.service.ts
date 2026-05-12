import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FinishedGoodsRepository } from './finished-goods.repository';
import { CreateFinishedGoodDto } from './dto/create-finished-good.dto';
import { UpdateFinishedGoodDto } from './dto/update-finished-good.dto';
import { QueryFinishedGoodsDto } from './dto/query-finished-goods.dto';
import { AdjustStockDto, StockAdjustmentType } from './dto/adjust-stock.dto';

@Injectable()
export class FinishedGoodsService {
  constructor(private readonly repo: FinishedGoodsRepository) {}

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
    return this.repo.create(tenantId, dto);
  }

  async update(tenantId: string, id: string, dto: UpdateFinishedGoodDto) {
    await this.findById(tenantId, id);
    return this.repo.update(tenantId, id, dto);
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.repo.delete(tenantId, id);
  }

  async adjustStock(tenantId: string, id: string, dto: AdjustStockDto) {
    const good = await this.findById(tenantId, id);
    if (dto.type === StockAdjustmentType.OUT && good.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${good.quantity}, requested: ${dto.quantity}`,
      );
    }
    return this.repo.adjustStock(tenantId, id, dto.type, dto.quantity);
  }
}
