import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/pagination.dto';

export class QueryProductionOrdersDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  factoryId?: string;
}
