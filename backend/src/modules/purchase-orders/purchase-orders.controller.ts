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
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  QueryPurchaseOrdersDto,
  CreateGrnDto,
} from './dto';
import { CurrentUser, TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller({ path: 'purchase-orders', version: '1' })
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get('stats')
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get PO dashboard stats' })
  async getStats(@TenantId() tenantId: string): Promise<unknown> {
    return this.purchaseOrdersService.getStats(tenantId);
  }

  @Post()
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a purchase order' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.purchaseOrdersService.create(tenantId, dto, user.sub);
  }

  @Get()
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryPurchaseOrdersDto,
  ): Promise<unknown> {
    return this.purchaseOrdersService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get purchase order detail' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.purchaseOrdersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a purchase order (DRAFT only)' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ): Promise<unknown> {
    return this.purchaseOrdersService.update(id, tenantId, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Submit PO for approval' })
  async submit(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.purchaseOrdersService.submit(id, tenantId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.APPROVE })
  @ApiOperation({ summary: 'Approve a submitted PO' })
  async approve(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.purchaseOrdersService.approve(id, tenantId, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Cancel / soft-delete a purchase order' })
  async cancel(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.purchaseOrdersService.cancel(id, tenantId);
  }

  @Post(':id/grns')
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a GRN (Goods Received Note) for an approved PO' })
  async createGrn(
    @Param('id') poId: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateGrnDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.purchaseOrdersService.createGrn(poId, tenantId, dto, user.sub);
  }

  @Post(':id/grns/:grnId/confirm')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.PURCHASE_ORDERS, action: PermissionAction.APPROVE })
  @ApiOperation({ summary: 'Confirm a GRN — updates inventory stock' })
  async confirmGrn(
    @Param('id') poId: string,
    @Param('grnId') grnId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.purchaseOrdersService.confirmGrn(poId, grnId, tenantId, user.sub);
  }
}
