import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SaleChannel, SaleStatus } from '@prisma/client';

export class QuerySalesDto {
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsEnum(SaleChannel) channel?: SaleChannel;
  @IsOptional() @IsEnum(SaleStatus) status?: SaleStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}
