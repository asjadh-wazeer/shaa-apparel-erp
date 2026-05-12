import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto';
import { TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';
import { BaseQueryDto } from '../../common/dto';

class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}

@ApiTags('Roles')
@ApiBearerAuth()
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a role' })
  create(@TenantId() tenantId: string, @Body() dto: CreateRoleDto): Promise<unknown> {
    return this.rolesService.create(tenantId, dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all roles' })
  findAll(@TenantId() tenantId: string, @Query() query: BaseQueryDto): Promise<unknown> {
    return this.rolesService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string): Promise<unknown> {
    return this.rolesService.findOne(id, tenantId);
  }

  @Put(':id/permissions')
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Replace all permissions on a role' })
  updatePermissions(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ): Promise<unknown> {
    return this.rolesService.updatePermissions(id, tenantId, dto.permissionIds);
  }

  @Delete(':id')
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id') id: string, @TenantId() tenantId: string): Promise<unknown> {
    return this.rolesService.remove(id, tenantId);
  }
}
