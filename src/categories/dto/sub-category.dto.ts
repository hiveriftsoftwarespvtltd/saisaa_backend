import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SubCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Subcategory name is required' })
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
