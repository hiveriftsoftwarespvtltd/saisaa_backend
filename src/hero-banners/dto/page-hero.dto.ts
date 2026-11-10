import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdatePageHeroDto {
  @IsString()
  @IsOptional()
  pageLabel?: string;

  @IsString()
  @IsOptional()
  routePath?: string;

  @IsString()
  @IsOptional()
  image?: string;

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

  @IsEnum(['dark', 'bottom', 'light', 'none'], {
    message: 'Overlay scrim must be dark, bottom, light, or none',
  })
  @IsOptional()
  overlayScrim?: string;

  @IsString()
  @IsOptional()
  objectPosition?: string;

  @IsEnum(['Active', 'Inactive'], {
    message: 'Status must be Active or Inactive',
  })
  @IsOptional()
  status?: string;
}

