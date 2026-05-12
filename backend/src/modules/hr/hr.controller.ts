import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../../common/enums';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeesDto,
  MarkAttendanceDto,
  BulkAttendanceDto,
  QueryAttendanceDto,
  UpsertKpiDto,
  QueryKpiDto,
} from './dto';

@ApiTags('HR')
@ApiBearerAuth()
@Controller({ path: 'hr', version: '1' })
export class HrController {
  constructor(private readonly service: HrService) {}

  // ── Employees ────────────────────────────────────────────────────────────────

  @Get('employees/all')
  @ApiOperation({ summary: 'List all active employees for dropdowns' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.READ })
  listAllEmployees(@TenantId() tenantId: string) {
    return this.service.listAllEmployees(tenantId);
  }

  @Get('employees')
  @ApiOperation({ summary: 'List employees (paginated)' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.READ })
  findAllEmployees(@TenantId() tenantId: string, @Query() query: QueryEmployeesDto) {
    return this.service.findAllEmployees(tenantId, query);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.CREATE })
  createEmployee(@TenantId() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(tenantId, dto);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.READ })
  findEmployee(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.findEmployee(id, tenantId);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.UPDATE })
  updateEmployee(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.updateEmployee(id, tenantId, dto);
  }

  @Delete('employees/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete employee' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.DELETE })
  removeEmployee(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.removeEmployee(id, tenantId);
  }

  // ── Attendance ────────────────────────────────────────────────────────────────

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance records (filter by date, month, employeeId)' })
  @Permissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.READ })
  getAttendance(@TenantId() tenantId: string, @Query() query: QueryAttendanceDto) {
    return this.service.getAttendance(tenantId, query);
  }

  @Post('attendance')
  @ApiOperation({ summary: 'Mark attendance for one employee' })
  @Permissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  markAttendance(
    @TenantId() tenantId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.markAttendance(tenantId, dto, userId);
  }

  @Post('attendance/bulk')
  @ApiOperation({ summary: 'Bulk mark attendance for multiple employees' })
  @Permissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  bulkMarkAttendance(
    @TenantId() tenantId: string,
    @Body() dto: BulkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.bulkMarkAttendance(tenantId, dto, userId);
  }

  @Get('attendance/summary')
  @ApiOperation({ summary: 'Get attendance summary totals for a month (YYYY-MM)' })
  @Permissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.READ })
  getAttendanceSummary(@TenantId() tenantId: string, @Query('month') month: string) {
    return this.service.getAttendanceSummary(tenantId, month ?? new Date().toISOString().slice(0, 7));
  }

  // ── KPI ───────────────────────────────────────────────────────────────────────

  @Get('kpi')
  @ApiOperation({ summary: 'Get KPI records (filter by employee, month, year)' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.READ })
  getKpiRecords(@TenantId() tenantId: string, @Query() query: QueryKpiDto) {
    return this.service.getKpiRecords(tenantId, query);
  }

  @Post('kpi')
  @ApiOperation({ summary: 'Create or update a KPI record (upsert by employee+month+year+metric)' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.CREATE })
  upsertKpi(@TenantId() tenantId: string, @Body() dto: UpsertKpiDto) {
    return this.service.upsertKpi(tenantId, dto);
  }

  @Delete('kpi/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a KPI record' })
  @Permissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.DELETE })
  deleteKpi(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.deleteKpi(id, tenantId);
  }
}
