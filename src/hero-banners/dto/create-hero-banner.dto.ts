import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class CreateHeroBannerDto {
  @IsString()
  @IsNotEmpty({ message: 'Hero banner image is required' })
  image: string;

  @IsString()
  @IsOptional()
  mobileImage?: string;

  @IsString()
  @IsOptional()
  eyebrow?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsEnum(['serif', 'script'], {
    message: 'Title style must be serif or script',
  })
  @IsOptional()
  titleStyle?: string;

  @IsEnum(['center', 'bottom', 'split-badge', 'clean'], {
    message: 'Layout preset must be center, bottom, split-badge, or clean',
  })
  @IsOptional()
  layoutPreset?: string;

  @IsEnum(['dark', 'bottom', 'light', 'none'], {
    message: 'Overlay scrim must be dark, bottom, light, or none',
  })
  @IsOptional()
  overlayScrim?: string;

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

