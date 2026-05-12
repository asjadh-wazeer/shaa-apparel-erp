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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehousesDto,
  QueryWarehouseStockDto,
} from './dto';
import { TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';

@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller({ path: 'warehouses', version: '1' })
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new warehouse' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateWarehouseDto,
  ): Promise<unknown> {
    return this.warehousesService.create(tenantId, dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List warehouses' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryWarehousesDto,
  ): Promise<unknown> {
    return this.warehousesService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get warehouse by ID (includes stock summary)' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.warehousesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a warehouse' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<unknown> {
    return this.warehousesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete a warehouse' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.warehousesService.remove(id, tenantId);
  }

  @Get(':id/stock')
  @Permissions({ module: PermissionModule.WAREHOUSES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get stock levels inside a warehouse' })
  async getStock(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query() query: QueryWarehouseStockDto,
  ): Promise<unknown> {
    return this.warehousesService.getStock(id, tenantId, query);
  }
}
