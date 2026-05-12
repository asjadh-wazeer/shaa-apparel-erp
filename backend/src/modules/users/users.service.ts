import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { hashPassword } from '../../common/utils';
import { buildPaginatedResponse, buildApiResponse } from '../../common/utils';
import {
  DuplicateRecordException,
  UserNotFoundException,
  ResourceNotFoundException,
} from '../../common/exceptions';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<unknown> {
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.usersRepository.findByEmail(dto.email, tenantId),
      this.usersRepository.findByUsername(dto.username, tenantId),
    ]);

    if (existingByEmail) throw new DuplicateRecordException('email');
    if (existingByUsername) throw new DuplicateRecordException('username');

    if (dto.roleIds?.length) {
      const roleCount = await this.prisma.role.count({
        where: { id: { in: dto.roleIds }, tenantId, deletedAt: null },
      });
      if (roleCount !== dto.roleIds.length) {
        throw new ResourceNotFoundException('Role', dto.roleIds.join(', '));
      }
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.usersRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      tenant: { connect: { id: tenantId } },
      ...(dto.roleIds?.length && {
        userRoles: {
          create: dto.roleIds.map((roleId) => ({ role: { connect: { id: roleId } } })),
        },
      }),
    });

    return buildApiResponse(this.sanitizeUser(user), 'User created successfully');
  }

  async findAll(tenantId: string, query: QueryUsersDto): Promise<unknown> {
    const where: Prisma.UserWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { username: { contains: query.search } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: 'desc' };

    const [users, total] = await this.usersRepository.findMany(tenantId, {
      skip: query.skip,
      take: query.limit,
      where,
      orderBy,
    });

    return buildPaginatedResponse(users.map(this.sanitizeUser), total, query.page, query.limit);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UserNotFoundException(id);

    return buildApiResponse(this.sanitizeUser(user));
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto): Promise<unknown> {
    const user = await this.usersRepository.findById(id);
    if (!user || user.tenantId !== tenantId) throw new UserNotFoundException(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findByEmail(dto.email, tenantId);
      if (existing) throw new DuplicateRecordException('email');
    }

    const updatedUser = await this.usersRepository.update(id, {
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: dto.status,
    });

    if (dto.roleIds) {
      await this.usersRepository.assignRoles(id, dto.roleIds);
    }

    return buildApiResponse(this.sanitizeUser(updatedUser), 'User updated successfully');
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const user = await this.usersRepository.findById(id);
    if (!user || user.tenantId !== tenantId) throw new UserNotFoundException(id);

    await this.usersRepository.softDelete(id);
    return buildApiResponse(null, 'User deleted successfully');
  }

  private sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
    const { passwordHash: _pw, ...rest } = user as { passwordHash: string; [key: string]: unknown };
    return rest;
  }
}
