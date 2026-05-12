import { Type } from 'class-transformer';
import {
  IsString, IsEnum, IsInt, IsOptional, IsDateString,
  Min, ValidateNested, IsArray, IsNotEmpty,
} from 'class-validator';
import { QualityCheckResult, DefectSeverity } from '@prisma/client';

export class CreateDefectDto {
  @IsString() @IsNotEmpty() defectCode: string;
  @IsString() @IsNotEmpty() defectName: string;
  @IsEnum(DefectSeverity) severity: DefectSeverity;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateQualityCheckDto {
  @IsString() @IsNotEmpty() productionOrderId: string;
  @IsString() @IsNotEmpty() checkNumber: string;
  @IsEnum(QualityCheckResult) result: QualityCheckResult;
  @IsInt() @Min(0) inspectedQty: number;
  @IsInt() @Min(0) passedQty: number;
  @IsInt() @Min(0) failedQty: number;
  @IsOptional() @IsInt() @Min(0) reworkQty?: number;
  @IsOptional() @IsString() inspectedById?: string;
  @IsOptional() @IsDateString() inspectedAt?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDefectDto)
  defects?: CreateDefectDto[];
}
