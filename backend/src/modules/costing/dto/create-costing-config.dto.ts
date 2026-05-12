import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCostingConfigDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Link to a specific garment type; null = global default' })
  @IsOptional()
  @IsString()
  garmentTypeId?: string;

  @ApiProperty({ description: 'Labour cost per garment piece (LKR)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  laborCostPerPcs: number;

  @ApiProperty({ description: 'Overhead percentage applied to direct costs' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  overheadPercent: number;

  @ApiProperty({ description: 'Target profit margin percentage' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  profitMarginPct: number;

  @ApiProperty({ description: 'Minimum expected wastage percentage' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  wastageMinPct: number;

  @ApiProperty({ description: 'Maximum expected wastage percentage' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  wastageMaxPct: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
