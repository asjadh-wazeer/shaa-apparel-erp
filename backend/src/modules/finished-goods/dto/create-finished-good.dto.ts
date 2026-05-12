import { IsString, IsOptional, IsInt, IsNumber, IsBoolean, Min, IsNotEmpty } from 'class-validator';

export class CreateFinishedGoodDto {
  @IsString() @IsNotEmpty() sku: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsInt() @Min(0) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsNumber() @Min(0) sellingPrice?: number;
  @IsOptional() @IsString() posItemId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
