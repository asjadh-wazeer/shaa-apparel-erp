import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DesignSubmissionsRepository } from './design-submissions.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import { CreateDesignSubmissionDto } from './dto/create-design-submission.dto';
import { QueryDesignSubmissionsDto } from './dto/query-design-submissions.dto';
import { RejectDesignSubmissionDto } from './dto/reject-design-submission.dto';

@Injectable()
export class DesignSubmissionsService {
  constructor(private readonly repo: DesignSubmissionsRepository) {}

  async findAll(tenantId: string, query: QueryDesignSubmissionsDto) {
    return this.repo.findMany(tenantId, query);
  }

  async findOne(id: string, tenantId: string) {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException(`Design submission ${id} not found`);
    return buildApiResponse(record);
  }

  async create(tenantId: string, dto: CreateDesignSubmissionDto, userId: string) {
    const reviewNumber = dto.reviewNumber ?? (await this.repo.generateReviewNumber(tenantId));
    const record = await this.repo.create(tenantId, {
      productionOrderId: dto.productionOrderId,
      reviewNumber,
      sizes: dto.sizes,
      notes: dto.notes,
      assigneeId: userId,
    });
    return buildApiResponse(record, 'Design submitted for review');
  }

  async approve(id: string, tenantId: string, approverId: string) {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException(`Design submission ${id} not found`);
    if (record.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot approve a submission with status ${record.status}`);
    }
    const updated = await this.repo.approve(id, approverId);
    return buildApiResponse(updated, 'Design approved');
  }

  async reject(id: string, tenantId: string, dto: RejectDesignSubmissionDto) {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException(`Design submission ${id} not found`);
    if (record.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot reject a submission with status ${record.status}`);
    }
    const updated = await this.repo.reject(id, dto.rejectedReason);
    return buildApiResponse(updated, 'Design rejected');
  }
}
