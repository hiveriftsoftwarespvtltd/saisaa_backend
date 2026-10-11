import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

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
