import { IsString, IsOptional, Allow } from 'class-validator';

export class SyncWishlistDto {
  @IsString()
  @IsOptional()
  userEmail?: string;

  @Allow()
  @IsOptional()
  products?: any;

  @Allow()
  @IsOptional()
  guestProducts?: any;
}
