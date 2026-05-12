import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'SHAA Apparel Factory 1' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'shaa-factory-1' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'LK', description: 'ISO country code' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Asia/Colombo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'LKR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Admin user email for the first admin account' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ description: 'Admin user password' })
  @IsString()
  @MinLength(8)
  adminPassword: string;

  @ApiProperty({ description: 'Admin first name' })
  @IsString()
  adminFirstName: string;

  @ApiProperty({ description: 'Admin last name' })
  @IsString()
  adminLastName: string;
}
