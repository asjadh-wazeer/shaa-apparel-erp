import {
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.PURCHASE_RECEIVED })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 100.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 'wh_id_here', description: 'Target warehouse ID' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 125.50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ example: 'PO-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceType?: string;

  @ApiPropertyOptional({ example: 'ref-id-here' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Received from supplier' })
  @IsOptional()
  @IsString()
  notes?: string;
}
