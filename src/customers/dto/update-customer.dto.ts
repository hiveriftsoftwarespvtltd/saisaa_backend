import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Active', 'VIP', 'Inactive'])
  status?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  addresses?: any[];
}
