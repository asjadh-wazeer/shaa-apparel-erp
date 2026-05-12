import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto';
import { buildApiResponse, buildPaginatedResponse } from '../../common/utils';
import { BaseQueryDto } from '../../common/dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoleDto): Promise<unknown> {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);

    if (dto.permissionIds?.length) {
      const count = await this.prisma.permission.count({
        where: { id: { in: dto.permissionIds } },
      });
      if (count !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        ...(dto.permissionIds?.length && {
          rolePermissions: {
            create: dto.permissionIds.map((permissionId) => ({ permissionId })),
          },
        }),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return buildApiResponse(role, 'Role created');
  }

  async findAll(tenantId: string, query: BaseQueryDto): Promise<unknown> {
    const where = {
      tenantId,
      deletedAt: null,
      ...(query.search && { name: { contains: query.search } }),
    };

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rolePermissions: { include: { permission: true } },
          _count: { select: { userRoles: true } },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return buildPaginatedResponse(roles, total, query.page, query.limit);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role not found`);
    return buildApiResponse(role);
  }

  async updatePermissions(id: string, tenantId: string, permissionIds: string[]): Promise<unknown> {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be modified');

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      }),
    ]);

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    await this.prisma.role.update({ where: { id }, data: { deletedAt: new Date() } });
    return buildApiResponse(null, 'Role deleted');
  }
}
