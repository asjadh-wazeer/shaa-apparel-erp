import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildApiResponse } from '../../common/utils';
import { PermissionModule, PermissionAction } from '../../common/enums';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<unknown> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    return buildApiResponse(permissions);
  }

  async findByModule(module: string): Promise<unknown> {
    const permissions = await this.prisma.permission.findMany({
      where: { module },
      orderBy: { action: 'asc' },
    });
    return buildApiResponse(permissions);
  }

  async seedDefaultPermissions(): Promise<void> {
    const modules = Object.values(PermissionModule);
    const actions = Object.values(PermissionAction);

    const permissionData = modules.flatMap((module) =>
      actions.map((action) => ({ module, action })),
    );

    await this.prisma.permission.createMany({
      data: permissionData,
      skipDuplicates: true,
    });
  }
}
