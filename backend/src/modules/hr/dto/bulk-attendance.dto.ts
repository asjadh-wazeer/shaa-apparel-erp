import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MarkAttendanceDto } from './mark-attendance.dto';

export class BulkAttendanceDto {
  @ApiProperty({ type: [MarkAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceDto)
  records: MarkAttendanceDto[];
}
