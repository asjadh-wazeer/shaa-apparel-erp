import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
    });
  }

  async findByUsername(username: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { username, tenantId, deletedAt: null },
    });
  }

  async findMany(
    tenantId: string,
    params: {
      skip: number;
      take: number;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    },
  ): Promise<[User[], number]> {
    const { skip, take, where, orderBy } = params;
    const baseWhere: Prisma.UserWhereInput = { tenantId, deletedAt: null, ...where };

    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where: baseWhere,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { userRoles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where: baseWhere }),
    ]);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      }),
    ]);
  }
}
