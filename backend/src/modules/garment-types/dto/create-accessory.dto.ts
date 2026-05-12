import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccessoryDto {
  @ApiProperty()
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity of this item per garment piece' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
