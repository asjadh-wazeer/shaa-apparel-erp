import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PosIntegrationRepository } from './pos-integration.repository';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { UpsertPosConfigDto } from './dto/upsert-pos-config.dto';

@Injectable()
export class PosIntegrationService {
  constructor(private readonly repo: PosIntegrationRepository) {}

  async getSalesStats(tenantId: string) {
    return this.repo.getSalesStats(tenantId);
  }

  async findManySales(tenantId: string, query: QuerySalesDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const { data, total } = await this.repo.findManySales(tenantId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      channel: query.channel,
      status: query.status,
      search: query.search,
      page,
      limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findSaleById(tenantId: string, id: string) {
    const sale = await this.repo.findSaleById(tenantId, id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }

  async createSale(tenantId: string, dto: CreateSaleDto) {
    try {
      const saleNumber = await this.repo.nextSaleNumber(tenantId);
      return await this.repo.createSale(tenantId, saleNumber, dto);
    } catch (err: any) {
      if (err.message?.includes('Insufficient stock') || err.message?.includes('not found')) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async updateSale(tenantId: string, id: string, dto: UpdateSaleDto) {
    await this.findSaleById(tenantId, id);
    return this.repo.updateSale(tenantId, id, dto);
  }

  async deleteSale(tenantId: string, id: string) {
    await this.findSaleById(tenantId, id);
    return this.repo.deleteSale(tenantId, id);
  }

  async getPosConfig(tenantId: string) {
    return this.repo.getPosConfig(tenantId);
  }

  async upsertPosConfig(tenantId: string, dto: UpsertPosConfigDto) {
    return this.repo.upsertPosConfig(tenantId, dto);
  }

  async getCatalog(tenantId: string) {
    return this.repo.getCatalog(tenantId);
  }
}
