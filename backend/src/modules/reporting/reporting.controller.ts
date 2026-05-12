import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ReportingService } from './reporting.service';

class ProductionReportQuery {
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() status?: string;
}

class AttendanceReportQuery {
  @IsOptional() @IsString() month?: string;
}

class QualityReportQuery {
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}

class KpiReportQuery {
  @IsOptional() @IsNumberString() month?: string;
  @IsOptional() @IsNumberString() year?: string;
}

@ApiTags('Reporting')
@ApiBearerAuth()
@Controller({ path: 'reporting', version: '1' })
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('production')
  getProduction(@Request() req: any, @Query() query: ProductionReportQuery) {
    return this.service.getProductionReport(req.user.tenantId, query);
  }

  @Get('inventory')
  getInventory(@Request() req: any) {
    return this.service.getInventoryReport(req.user.tenantId);
  }

  @Get('attendance')
  getAttendance(@Request() req: any, @Query() query: AttendanceReportQuery) {
    const today = new Date();
    const month = query.month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return this.service.getAttendanceReport(req.user.tenantId, month);
  }

  @Get('quality')
  getQuality(@Request() req: any, @Query() query: QualityReportQuery) {
    return this.service.getQualityReport(req.user.tenantId, query);
  }

  @Get('kpi')
  getKpi(@Request() req: any, @Query() query: KpiReportQuery) {
    return this.service.getKpiReport(req.user.tenantId, {
      month: query.month ? parseInt(query.month, 10) : undefined,
      year: query.year ? parseInt(query.year, 10) : undefined,
    });
  }
}
