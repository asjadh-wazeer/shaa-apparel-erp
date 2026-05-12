import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { comparePassword } from '../../common/utils';
import {
  InvalidCredentialsException,
  AccountSuspendedException,
  UserNotFoundException,
} from '../../common/exceptions';
import { JwtPayload } from '../../common/interfaces';
import { LoginDto, RefreshTokenDto } from './dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) throw new InvalidCredentialsException();

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new InvalidCredentialsException();

    if (user.status === 'SUSPENDED') throw new AccountSuspendedException();
    if (user.status !== 'ACTIVE') throw new InvalidCredentialsException();

    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokenPair(user.id, user.tenantId, user.email, roles);

    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          deviceInfo: dto.deviceInfo,
          ipAddress,
          expiresAt: this.getRefreshTokenExpiry(),
        },
      }),
      this.prisma.loginSession.create({
        data: {
          userId: user.id,
          ipAddress,
          deviceInfo: dto.deviceInfo,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    this.logger.log(`User ${user.email} logged in from ${ipAddress}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        roles,
      },
      ...tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
          },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.user.status !== 'ACTIVE') {
      await this.revokeRefreshToken(storedToken.token);
      throw new AccountSuspendedException();
    }

    const roles = storedToken.user.userRoles.map((ur) => ur.role.name);
    const newTokens = await this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.tenantId,
      storedToken.user.email,
      roles,
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newTokens.refreshToken,
          deviceInfo: storedToken.deviceInfo,
          ipAddress: storedToken.ipAddress,
          expiresAt: this.getRefreshTokenExpiry(),
        },
      }),
    ]);

    return newTokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
    await this.prisma.loginSession.updateMany({
      where: { userId, loggedOutAt: null },
      data: { loggedOutAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.loginSession.updateMany({
        where: { userId, loggedOutAt: null },
        data: { loggedOutAt: new Date() },
      }),
    ]);
  }

  async getProfile(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        lastLoginAt: true,
        tenantId: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UserNotFoundException(userId);

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map(
        (rp) => `${rp.permission.module}:${rp.permission.action}`,
      ),
    );

    return { ...user, roles, permissions };
  }

  private async generateTokenPair(
    userId: string,
    tenantId: string,
    email: string,
    roles: string[],
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, tenantId, email, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiry', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiry', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  private getRefreshTokenExpiry(): Date {
    const days = 7;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }
}
