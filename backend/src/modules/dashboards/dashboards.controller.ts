import { Controller, Get, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller({ path: 'dashboards', version: '1' })
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}

  @Get('overview')
  getOverview(@Request() req: any) {
    return this.service.getOverview(req.user.tenantId);
  }
}
