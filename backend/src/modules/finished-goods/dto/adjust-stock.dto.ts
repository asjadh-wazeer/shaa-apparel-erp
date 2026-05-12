import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum StockAdjustmentType {
  IN = 'IN',
  OUT = 'OUT',
}

export class AdjustStockDto {
  @IsEnum(StockAdjustmentType) type: StockAdjustmentType;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() reason?: string;
}
