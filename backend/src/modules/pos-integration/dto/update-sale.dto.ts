import { IsOptional, IsEnum, IsString } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class UpdateSaleDto {
  @IsOptional() @IsEnum(SaleStatus) status?: SaleStatus;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() customerName?: string;
}
