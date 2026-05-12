import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalculationDto {
  @ApiProperty({ description: 'Production order to cost' })
  @IsString()
  productionOrderId: string;

  @ApiPropertyOptional({ description: 'Costing config to use; uses garment-type default if omitted' })
  @IsOptional()
  @IsString()
  costingConfigId?: string;

  @ApiPropertyOptional({ description: 'Override selling price per piece' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPricePerPcs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
