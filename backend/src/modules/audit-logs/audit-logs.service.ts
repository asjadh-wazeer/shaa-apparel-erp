import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';

export interface QueryAuditLogsDto {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, query: QueryAuditLogsDto = {}) {
    const { page = 1, limit = 50, action, entityType, userId, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(userId && { userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59Z') }),
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResponse(rows, total, page, limit);
  }
}
