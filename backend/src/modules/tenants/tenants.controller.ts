import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto';
import { Public, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post('provision')
  @ApiOperation({ summary: 'Provision a new tenant (onboarding)' })
  provision(@Body() dto: CreateTenantDto): Promise<unknown> {
    return this.tenantsService.provision(dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.TENANTS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all tenants (super admin only)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20): Promise<unknown> {
    return this.tenantsService.findAll(+page, +limit);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.TENANTS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string): Promise<unknown> {
    return this.tenantsService.findById(id);
  }
}
