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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { CurrentUser, TenantId, Permissions } from '../../common/decorators';
import { PermissionModule, PermissionAction } from '../../common/enums';
import { JwtPayload } from '../../common/interfaces';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions({ module: PermissionModule.USERS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateUserDto,
  ): Promise<unknown> {
    return this.usersService.create(tenantId, dto);
  }

  @Get()
  @Permissions({ module: PermissionModule.USERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all users for the tenant' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryUsersDto,
  ): Promise<unknown> {
    return this.usersService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.USERS, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.USERS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<unknown> {
    return this.usersService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.USERS, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete a user' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<unknown> {
    if (id === currentUser.sub) {
      throw new Error('Cannot delete your own account');
    }
    return this.usersService.remove(id, tenantId);
  }
}
