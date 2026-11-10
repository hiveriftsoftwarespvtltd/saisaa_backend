import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class ReorderHeroBannersDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'orderedIds must be a non-empty array' })
  @IsString({ each: true })
  orderedIds: string[];
}

