import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CostingService } from './costing.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../../common/enums';
import {
  CreateCostingConfigDto,
  UpdateCostingConfigDto,
  CreateCalculationDto,
  UpdateCalculationDto,
  QueryCalculationsDto,
  RecordWastageDto,
} from './dto';

@ApiTags('Costing')
@ApiBearerAuth()
@Controller({ path: 'costing', version: '1' })
export class CostingController {
  constructor(private readonly service: CostingService) {}

  // ── Configs ─────────────────────────────────────────────────────────────────

  @Get('configs')
  @ApiOperation({ summary: 'List costing configs' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  getConfigs(@TenantId() tenantId: string) {
    return this.service.getConfigs(tenantId);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Create costing config' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.CREATE })
  createConfig(@TenantId() tenantId: string, @Body() dto: CreateCostingConfigDto) {
    return this.service.createConfig(tenantId, dto);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Update costing config' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.UPDATE })
  updateConfig(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCostingConfigDto,
  ) {
    return this.service.updateConfig(id, tenantId, dto);
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete costing config' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.DELETE })
  deleteConfig(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.deleteConfig(id, tenantId);
  }

  // ── Calculations ─────────────────────────────────────────────────────────────

  @Get('calculations')
  @ApiOperation({ summary: 'List costing calculations' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  getCalculations(@TenantId() tenantId: string, @Query() query: QueryCalculationsDto) {
    return this.service.getCalculations(tenantId, query);
  }

  @Get('calculations/:id')
  @ApiOperation({ summary: 'Get costing calculation detail' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  getCalculation(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.getCalculation(id, tenantId);
  }

  @Post('calculations')
  @ApiOperation({ summary: 'Calculate cost for a production order from BOM + config' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.CREATE })
  calculate(
    @TenantId() tenantId: string,
    @Body() dto: CreateCalculationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.calculate(tenantId, dto, userId);
  }

  @Patch('calculations/:id')
  @ApiOperation({ summary: 'Update selling price / notes on a calculation' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.UPDATE })
  updateCalculation(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCalculationDto,
  ) {
    return this.service.updateCalculation(id, tenantId, dto);
  }

  @Post('calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a costing calculation' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.APPROVE })
  approveCalculation(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.approveCalculation(id, tenantId, userId);
  }

  // ── Wastage ──────────────────────────────────────────────────────────────────

  @Get('wastage')
  @ApiOperation({ summary: 'Get wastage records for a batch' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  getWastage(@Query('batchId') batchId: string, @TenantId() tenantId: string) {
    return this.service.getWastage(batchId, tenantId);
  }

  @Post('wastage')
  @ApiOperation({ summary: 'Record a wastage event for a batch' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.CREATE })
  recordWastage(
    @TenantId() tenantId: string,
    @Body() dto: RecordWastageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.recordWastage(tenantId, dto, userId);
  }
}
