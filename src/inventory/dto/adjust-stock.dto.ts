import { IsNumber, Min, IsOptional } from 'class-validator';

export class AdjustStockDto {
  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;
}
