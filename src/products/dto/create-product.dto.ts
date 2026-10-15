import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SizeVariantDto {
  @IsString()
  size: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;
}

export class CreateProductDto {
  @IsString()
  @IsOptional()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  category: string; // suits, sarees, kurtis

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  reviewCount?: number;

  @IsBoolean()
  @IsOptional()
  isBestSeller?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isNewArrival?: boolean;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsBoolean()
  @IsOptional()
  comingSoon?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  fabric?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  colorHex?: string;

  @IsString()
  @IsOptional()
  work?: string;

  @IsString()
  @IsOptional()
  care?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeVariantDto)
  @IsOptional()
  sizeVariants?: SizeVariantDto[];

  @IsString()
  @IsOptional()
  cardImage?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  homeImage?: string;

  @IsString()
  @IsOptional()
  originalImage?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Draft', 'Archived'])
  status?: string;
}
