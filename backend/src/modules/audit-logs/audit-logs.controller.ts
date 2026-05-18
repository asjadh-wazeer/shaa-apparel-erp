import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly auditlogsService: AuditLogsService) {}

  @Get()
  findMany(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditlogsService.findMany(req.user.tenantId, {
      page:       page ? Number(page) : undefined,
      limit:      limit ? Number(limit) : undefined,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo,
    });
  }
}
