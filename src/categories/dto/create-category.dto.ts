import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  subCategories?: string[];
}
