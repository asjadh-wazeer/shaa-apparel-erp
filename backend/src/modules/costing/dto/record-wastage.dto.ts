import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordWastageDto {
  @ApiProperty()
  @IsString()
  batchId: string;

  @ApiPropertyOptional({ description: 'Specific inventory item that was wasted' })
  @IsOptional()
  @IsString()
  inventoryItemId?: string;

  @ApiProperty({ description: 'e.g. CUTTING_WASTE, SEWING_DEFECT, FABRIC_DAMAGE' })
  @IsString()
  @MaxLength(100)
  wastageType: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Wastage as % of planned quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  wastagePercent: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isThresholdExceeded?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
