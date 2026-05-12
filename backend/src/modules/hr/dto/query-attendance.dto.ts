import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAttendanceDto {
  @ApiPropertyOptional({ example: '2026-05-11', description: 'Filter by date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '2026-05', description: 'Filter by month (YYYY-MM)' })
  @IsOptional()
  @IsString()
  month?: string;
}
