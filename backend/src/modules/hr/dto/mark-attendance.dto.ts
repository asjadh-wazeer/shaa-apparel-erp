import { IsString, IsOptional, IsIn, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty({ example: '2026-05-11' })
  @IsString()
  date: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'] })
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'])
  status: string;

  @ApiPropertyOptional({ example: '08:05' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  checkIn?: string;

  @ApiPropertyOptional({ example: '17:30' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  hoursWorked?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
