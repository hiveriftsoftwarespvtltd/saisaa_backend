import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOurStoryDto {
  @IsString()
  @IsOptional()
  eyebrow?: string;

  @IsString()
  @IsNotEmpty({ message: 'Story title is required' })
  title: string;

  @IsString()
  @IsOptional()
  scriptText?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsString()
  @IsNotEmpty({ message: 'Story image is required' })
  image: string;

  @IsString()
  @IsOptional()
  objectPosition?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pillars?: string[];

  @IsString()
  @IsOptional()
  badgeLabel?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;
}

export class UpdateOurStoryDto {
  @IsString()
  @IsOptional()
  eyebrow?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  scriptText?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  objectPosition?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pillars?: string[];

  @IsString()
  @IsOptional()
  badgeLabel?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;
}

