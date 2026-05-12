import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateTenantDto } from './dto';
import { hashPassword } from '../../common/utils';
import { buildApiResponse } from '../../common/utils';
import { SYSTEM_ROLES } from '../../common/constants';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async provision(dto: CreateTenantDto): Promise<unknown> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);

    await this.permissionsService.seedDefaultPermissions();

    const allPermissions = await this.prisma.permission.findMany();
    const adminPasswordHash = await hashPassword(dto.adminPassword);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          country: dto.country,
          timezone: dto.timezone ?? 'UTC',
          currency: dto.currency ?? 'USD',
          status: 'TRIAL',
        },
      });

      const adminRole = await tx.role.create({
        data: {
          tenantId: newTenant.id,
          name: SYSTEM_ROLES.TENANT_ADMIN,
          description: 'Full administrative access',
          isSystem: true,
          rolePermissions: {
            create: allPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      const viewerRole = await tx.role.create({
        data: {
          tenantId: newTenant.id,
          name: SYSTEM_ROLES.VIEWER,
          description: 'Read-only access',
          isSystem: true,
        },
      });

      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: dto.adminEmail,
          username: dto.adminEmail.split('@')[0],
          passwordHash: adminPasswordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          status: 'ACTIVE',
          userRoles: { create: { roleId: adminRole.id } },
        },
      });

      await tx.systemSetting.createMany({
        data: [
          { tenantId: newTenant.id, key: 'currency', value: dto.currency ?? 'USD', category: 'general', isPublic: true },
          { tenantId: newTenant.id, key: 'timezone', value: dto.timezone ?? 'UTC', category: 'general', isPublic: true },
          { tenantId: newTenant.id, key: 'wastage_max_percent', value: '15', category: 'production', isPublic: false },
        ],
      });

      this.logger.log(`Tenant "${newTenant.slug}" provisioned successfully`);
      return newTenant;
    });

    return buildApiResponse(tenant, 'Tenant provisioned successfully');
  }

  async findById(id: string): Promise<unknown> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        tenantSubscription: { include: { plan: true } },
        _count: { select: { users: true, factories: true } },
      },
    });
    return buildApiResponse(tenant);
  }

  async findAll(page = 1, limit = 20): Promise<unknown> {
    const skip = (page - 1) * limit;
    const [tenants, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { success: true, data: tenants, meta: { page, limit, total } };
  }
}
