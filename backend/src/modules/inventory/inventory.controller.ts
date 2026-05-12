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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  QueryInventoryItemsDto,
  CreateStockMovementDto,
  QueryMovementsDto,
} from './dto';
import { CurrentUser, TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new inventory item' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateInventoryItemDto,
  ): Promise<unknown> {
    return this.inventoryService.create(tenantId, dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List inventory items' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryInventoryItemsDto,
  ): Promise<unknown> {
    return this.inventoryService.findAll(tenantId, query);
  }

  @Get('low-stock')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get items at or below reorder level' })
  async getLowStock(@TenantId() tenantId: string): Promise<unknown> {
    return this.inventoryService.findLowStock(tenantId);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.inventoryService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update an inventory item' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<unknown> {
    return this.inventoryService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete an inventory item' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.inventoryService.remove(id, tenantId);
  }

  @Post(':id/movements')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Record a stock movement for an item' })
  async recordMovement(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<unknown> {
    return this.inventoryService.recordMovement(id, tenantId, dto, currentUser.sub);
  }

  @Get(':id/movements')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get movement history for an item' })
  async getMovements(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query() query: QueryMovementsDto,
  ): Promise<unknown> {
    return this.inventoryService.getMovements(id, tenantId, query);
  }

  @Get(':id/stock')
  @Permissions({ module: PermissionModule.INVENTORY, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get current stock levels across all warehouses' })
  async getStockLevels(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.inventoryService.getStockLevels(id, tenantId);
  }
}
