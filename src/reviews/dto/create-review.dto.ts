import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsEmail,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productImage?: string;

  @IsString()
  @IsNotEmpty()
  customer: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  review: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
