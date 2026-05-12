import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GarmentTypesService } from './garment-types.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../../common/enums';
import {
  CreateGarmentTypeDto,
  UpdateGarmentTypeDto,
  QueryGarmentTypesDto,
  CreateAccessoryDto,
  UpdateAccessoryDto,
} from './dto';

@ApiTags('Garment Types')
@ApiBearerAuth()
@Controller({ path: 'garment-types', version: '1' })
export class GarmentTypesController {
  constructor(private readonly service: GarmentTypesService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all garment types for dropdown' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  listAll(@TenantId() tenantId: string) {
    return this.service.listAll(tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List garment types (paginated)' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  findAll(@TenantId() tenantId: string, @Query() query: QueryGarmentTypesDto) {
    return this.service.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create garment type' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.CREATE })
  create(@TenantId() tenantId: string, @Body() dto: CreateGarmentTypeDto) {
    return this.service.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get garment type with BOM' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.READ })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update garment type' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.UPDATE })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateGarmentTypeDto,
  ) {
    return this.service.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete garment type' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.DELETE })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.service.remove(id, tenantId);
  }

  // ── Accessories (BOM) ───────────────────────────────────────────────────────

  @Post(':id/accessories')
  @ApiOperation({ summary: 'Add BOM item to garment type' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.CREATE })
  addAccessory(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateAccessoryDto,
  ) {
    return this.service.addAccessory(id, tenantId, dto);
  }

  @Patch(':id/accessories/:accessoryId')
  @ApiOperation({ summary: 'Update BOM item' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.UPDATE })
  updateAccessory(
    @Param('id') id: string,
    @Param('accessoryId') accessoryId: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateAccessoryDto,
  ) {
    return this.service.updateAccessory(id, accessoryId, tenantId, dto);
  }

  @Delete(':id/accessories/:accessoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove BOM item' })
  @Permissions({ module: PermissionModule.COSTING, action: PermissionAction.DELETE })
  removeAccessory(
    @Param('id') id: string,
    @Param('accessoryId') accessoryId: string,
    @TenantId() tenantId: string,
  ) {
    return this.service.removeAccessory(id, accessoryId, tenantId);
  }
}
