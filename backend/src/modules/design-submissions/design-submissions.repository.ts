import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QueryDesignSubmissionsDto } from './dto/query-design-submissions.dto';

const INCLUDE = {
  productionOrder: { select: { id: true, orderNumber: true, description: true } },
} as const;

@Injectable()
export class DesignSubmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, query: QueryDesignSubmissionsDto) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { reviewNumber: { contains: search } },
          { productionOrder: { description: { contains: search } } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.designSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      this.prisma.designSubmission.count({ where }),
    ]);

    return buildPaginatedResponse(rows, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.designSubmission.findFirst({
      where: { id, tenantId },
      include: INCLUDE,
    });
  }

  async create(tenantId: string, data: {
    productionOrderId: string;
    reviewNumber: string;
    sizes?: string;
    notes?: string;
    assigneeId?: string;
  }) {
    return this.prisma.designSubmission.create({
      data: { tenantId, ...data },
      include: INCLUDE,
    });
  }

  async approve(id: string, approverId: string) {
    return this.prisma.designSubmission.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
      include: INCLUDE,
    });
  }

  async reject(id: string, rejectedReason: string) {
    return this.prisma.designSubmission.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason },
      include: INCLUDE,
    });
  }

  async generateReviewNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.designSubmission.count({ where: { tenantId } });
    return `DES-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
