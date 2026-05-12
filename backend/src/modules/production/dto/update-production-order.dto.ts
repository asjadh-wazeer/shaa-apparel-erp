import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductionOrderDto } from './create-production-order.dto';

export class UpdateProductionOrderDto extends PartialType(CreateProductionOrderDto) {
  @ApiPropertyOptional({
    enum: ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'])
  status?: string;
}
