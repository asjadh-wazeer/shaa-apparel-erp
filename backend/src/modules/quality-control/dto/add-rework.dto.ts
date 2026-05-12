import { IsString, IsInt, IsOptional, IsEnum, Min, IsNotEmpty } from 'class-validator';
import { ReworkStatus } from '@prisma/client';

export class AddReworkDto {
  @IsString() @IsNotEmpty() reworkType: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateReworkDto {
  @IsOptional() @IsEnum(ReworkStatus) status?: ReworkStatus;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() notes?: string;
}
