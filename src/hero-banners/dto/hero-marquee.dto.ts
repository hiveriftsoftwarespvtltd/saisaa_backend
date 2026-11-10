import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateHeroMarqueeDto {
  @IsString()
  @IsNotEmpty({ message: 'Marquee text is required' })
  text: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: string;
}

export class UpdateHeroMarqueeDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(['Active', 'Inactive'])
  @IsOptional()
  status?: string;
}

