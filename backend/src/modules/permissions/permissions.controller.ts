import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all system permissions' })
  findAll(): Promise<unknown> {
    return this.permissionsService.findAll();
  }

  @Get('module/:module')
  @Permissions({ module: PermissionModule.ROLES, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get permissions for a module' })
  findByModule(@Param('module') module: string): Promise<unknown> {
    return this.permissionsService.findByModule(module);
  }
}
