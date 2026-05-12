import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionDefinition } from '../decorators';
import { JwtPayload } from '../interfaces';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionDefinition[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) return false;

    const userPermissions = await this.getUserPermissions(user.sub, user.tenantId);

    const hasAll = requiredPermissions.every((required) =>
      userPermissions.some(
        (p) => p.module === required.module && p.action === required.action,
      ),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions to access this resource');
    }

    return true;
  }

  private async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<{ module: string; action: string }[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions: { module: string; action: string }[] = [];

    for (const userRole of userRoles) {
      if (userRole.role.tenantId !== tenantId) continue;
      for (const rp of userRole.role.rolePermissions) {
        permissions.push({
          module: rp.permission.module,
          action: rp.permission.action,
        });
      }
    }

    return permissions;
  }
}
