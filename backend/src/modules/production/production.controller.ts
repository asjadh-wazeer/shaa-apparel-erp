import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import {
  CreateProductionOrderDto,
  UpdateProductionOrderDto,
  QueryProductionOrdersDto,
  CreateProductionBatchDto,
  AdvanceStageDto,
} from './dto';
import { CurrentUser, TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Production')
@ApiBearerAuth()
@Controller({ path: 'production', version: '1' })
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('stage-configs')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get stage configurations for the tenant (auto-seeds defaults)' })
  async getStageConfigs(@TenantId() tenantId: string): Promise<unknown> {
    return this.productionService.getStageConfigs(tenantId);
  }

  @Get('stats')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get production dashboard stats' })
  async getStats(@TenantId() tenantId: string): Promise<unknown> {
    return this.productionService.getStats(tenantId);
  }

  @Get('by-stage')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get active batches filtered by stage codes (comma-separated)' })
  @ApiQuery({ name: 'codes', description: 'Comma-separated stage codes e.g. CUTTING,SEWING' })
  async getBatchesByStage(
    @TenantId() tenantId: string,
    @Query('codes') codes: string,
  ): Promise<unknown> {
    return this.productionService.getBatchesByStage(tenantId, codes);
  }

  @Post()
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new production order' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateProductionOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.productionService.create(tenantId, dto, user.sub);
  }

  @Get()
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List production orders' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryProductionOrdersDto,
  ): Promise<unknown> {
    return this.productionService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get production order detail' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.productionService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a production order' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateProductionOrderDto,
  ): Promise<unknown> {
    return this.productionService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Delete a production order' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.productionService.remove(id, tenantId);
  }

  @Post(':id/batches')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a production batch for an order' })
  async createBatch(
    @Param('id') orderId: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateProductionBatchDto,
  ): Promise<unknown> {
    return this.productionService.createBatch(orderId, tenantId, dto);
  }

  @Get(':id/batches/:batchId')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get batch detail with stage history' })
  async findBatch(
    @Param('id') orderId: string,
    @Param('batchId') batchId: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.productionService.findBatch(orderId, batchId, tenantId);
  }

  @Post(':id/batches/:batchId/advance')
  @Permissions({ module: PermissionModule.PRODUCTION, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Complete current stage and advance batch to next stage' })
  async advanceStage(
    @Param('id') orderId: string,
    @Param('batchId') batchId: string,
    @TenantId() tenantId: string,
    @Body() dto: AdvanceStageDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.productionService.advanceStage(orderId, batchId, tenantId, dto, user.sub);
  }
}
