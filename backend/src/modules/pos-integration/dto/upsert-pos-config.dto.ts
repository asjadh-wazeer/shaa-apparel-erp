import { IsString, IsOptional, IsInt, IsBoolean, Min, IsNotEmpty } from 'class-validator';

export class UpsertPosConfigDto {
  @IsString() @IsNotEmpty() posSystemName: string;
  @IsOptional() @IsString() apiEndpoint?: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsInt() @Min(1) syncIntervalMin?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
