import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InventoryItemType } from '@prisma/client';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'FAB-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Cotton Fabric White' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Premium cotton fabric, 60 GSM' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: InventoryItemType, example: InventoryItemType.FABRIC })
  @IsEnum(InventoryItemType)
  type: InventoryItemType;

  @ApiProperty({ example: 'meters' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  unit: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;

  @ApiPropertyOptional({ example: 125.50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  barcode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
