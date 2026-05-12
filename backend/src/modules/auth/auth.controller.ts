import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { Public, CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { buildApiResponse } from '../../common/utils';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<unknown> {
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const result = await this.authService.login(dto, ipAddress);
    return buildApiResponse(result, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto): Promise<unknown> {
    const tokens = await this.authService.refreshTokens(dto);
    return buildApiResponse(tokens, 'Tokens refreshed');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefreshTokenDto,
  ): Promise<unknown> {
    await this.authService.logout(user.sub, dto.refreshToken);
    return buildApiResponse(null, 'Logged out successfully');
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: JwtPayload): Promise<unknown> {
    await this.authService.logoutAll(user.sub);
    return buildApiResponse(null, 'Logged out from all devices');
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with roles and permissions' })
  @ApiOkResponse({ description: 'User profile retrieved' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    const profile = await this.authService.getProfile(user.sub);
    return buildApiResponse(profile);
  }
}
