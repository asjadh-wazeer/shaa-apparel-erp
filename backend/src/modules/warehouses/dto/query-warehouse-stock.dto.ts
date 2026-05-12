import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryItemType } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/pagination.dto';

export class QueryWarehouseStockDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: InventoryItemType })
  @IsOptional()
  @IsEnum(InventoryItemType)
  type?: InventoryItemType;

  @ApiPropertyOptional({ description: 'Filter to low-stock entries only' })
  @IsOptional()
  lowStockOnly?: boolean;
}
