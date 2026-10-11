import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['Percentage', 'Fixed', 'percentage', 'flat'])
  type: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  @IsOptional()
  discount?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrder?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumDiscount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsString()
  @IsOptional()
  validFrom?: string;

  @IsString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsIn(['Active', 'Inactive', 'Expired'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
