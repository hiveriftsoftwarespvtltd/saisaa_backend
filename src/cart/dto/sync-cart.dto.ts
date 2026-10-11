import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SyncCartDto {
  @IsString()
  @IsOptional()
  userEmail?: string;

  @IsArray()
  items: any[];
}
