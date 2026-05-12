import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdvanceStageDto {
  @ApiProperty({ minimum: 0, description: 'Pieces completed at this stage' })
  @IsInt()
  @Min(0)
  completedQty: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Pieces rejected at this stage' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rejectedQty?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  actualMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
