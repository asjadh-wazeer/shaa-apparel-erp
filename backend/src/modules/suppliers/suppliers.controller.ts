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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from './dto';
import { TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller({ path: 'suppliers', version: '1' })
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a supplier' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateSupplierDto,
  ): Promise<unknown> {
    return this.suppliersService.create(tenantId, dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List suppliers' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QuerySuppliersDto,
  ): Promise<unknown> {
    return this.suppliersService.findAll(tenantId, query);
  }

  @Get('all')
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get all active suppliers (unpaginated, for dropdowns)' })
  async listAll(@TenantId() tenantId: string): Promise<unknown> {
    return this.suppliersService.listAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get supplier by ID' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.suppliersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a supplier' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<unknown> {
    return this.suppliersService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.SUPPLIERS, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete a supplier' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.suppliersService.remove(id, tenantId);
  }
}
