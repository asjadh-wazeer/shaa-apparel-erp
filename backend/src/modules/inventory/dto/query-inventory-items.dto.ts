import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { InventoryItemType } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/pagination.dto';

export class QueryInventoryItemsDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: InventoryItemType })
  @IsOptional()
  @IsEnum(InventoryItemType)
  type?: InventoryItemType;

  @ApiPropertyOptional({ description: 'Filter to only items at or below reorder level' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  lowStockOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
