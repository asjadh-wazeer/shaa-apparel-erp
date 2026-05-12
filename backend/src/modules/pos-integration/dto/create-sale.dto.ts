import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsDateString, Min, IsNotEmpty } from 'class-validator';
import { SaleChannel, SaleStatus } from '@prisma/client';

export class CreateSaleDto {
  @IsString() @IsNotEmpty() finishedGoodId: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsEnum(SaleChannel) channel?: SaleChannel;
  @IsOptional() @IsEnum(SaleStatus) status?: SaleStatus;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() saleDate?: string;
}
