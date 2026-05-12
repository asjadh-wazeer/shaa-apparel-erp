import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { QualityCheckResult } from '@prisma/client';

export class QueryQualityChecksDto {
  @IsOptional() @IsString() productionOrderId?: string;
  @IsOptional() @IsEnum(QualityCheckResult) result?: QualityCheckResult;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}
