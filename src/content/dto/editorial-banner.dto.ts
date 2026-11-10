import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEditorialBannerDto {
  @IsString()
  @IsNotEmpty({ message: 'Editorial banner image is required' })
  image: string;

  @IsString()
  @IsOptional()
  eyebrow?: string;

  @IsString()
  @IsNotEmpty({ message: 'Editorial banner title is required' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsEnum(['ivory', 'emerald', 'blush'], {
    message: 'Theme must be ivory, emerald, or blush',
  })
  @IsOptional()
  theme?: string;

  @IsEnum(['left', 'right'], {
    message: 'Image position must be left or right',
  })
  @IsOptional()
  imagePosition?: string;

  @IsString()
  @IsOptional()
  objectPosition?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;
}

export class UpdateEditorialBannerDto {
  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  eyebrow?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsEnum(['ivory', 'emerald', 'blush'], {
    message: 'Theme must be ivory, emerald, or blush',
  })
  @IsOptional()
  theme?: string;

  @IsEnum(['left', 'right'], {
    message: 'Image position must be left or right',
  })
  @IsOptional()
  imagePosition?: string;

  @IsString()
  @IsOptional()
  objectPosition?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;
}

export class ReorderContentDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'orderedIds must be a non-empty array' })
  @IsString({ each: true })
  orderedIds: string[];
}

