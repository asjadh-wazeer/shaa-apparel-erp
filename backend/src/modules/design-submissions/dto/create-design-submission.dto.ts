import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateDesignSubmissionDto {
  @IsString() @IsNotEmpty()
  productionOrderId: string;

  @IsString() @IsOptional()
  reviewNumber?: string;

  @IsString() @IsOptional()
  sizes?: string;

  @IsString() @IsOptional()
  notes?: string;
}
