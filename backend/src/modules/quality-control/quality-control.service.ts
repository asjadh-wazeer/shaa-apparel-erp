import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { QualityControlRepository } from './quality-control.repository';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { QueryQualityChecksDto } from './dto/query-quality-checks.dto';
import { AddReworkDto, UpdateReworkDto } from './dto/add-rework.dto';

@Injectable()
export class QualityControlService {
  constructor(private readonly repo: QualityControlRepository) {}

  async getStats(tenantId: string) {
    return this.repo.getStats(tenantId);
  }

  async findMany(tenantId: string, query: QueryQualityChecksDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const { data, total } = await this.repo.findMany(tenantId, {
      productionOrderId: query.productionOrderId,
      result: query.result,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page,
      limit,
    });
    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const check = await this.repo.findById(tenantId, id);
    if (!check) throw new NotFoundException(`Quality check ${id} not found`);
    return check;
  }

  async create(tenantId: string, dto: CreateQualityCheckDto) {
    return this.repo.create(tenantId, dto);
  }

  async update(tenantId: string, id: string, dto: UpdateQualityCheckDto) {
    await this.findById(tenantId, id);
    return this.repo.update(tenantId, id, dto);
  }

  async approve(tenantId: string, id: string, approverId: string) {
    const check = await this.findById(tenantId, id);
    if (check.approvedAt) throw new ForbiddenException('Quality check already approved');
    return this.repo.approve(tenantId, id, approverId);
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.repo.delete(tenantId, id);
  }

  async addRework(tenantId: string, checkId: string, dto: AddReworkDto) {
    await this.findById(tenantId, checkId);
    return this.repo.addRework(tenantId, checkId, dto);
  }

  async updateRework(tenantId: string, checkId: string, reworkId: string, dto: UpdateReworkDto) {
    await this.findById(tenantId, checkId);
    return this.repo.updateRework(tenantId, reworkId, dto);
  }
}
