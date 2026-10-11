import { IsString, IsIn } from 'class-validator';

export class UpdateReviewStatusDto {
  @IsString()
  @IsIn(['Pending', 'Approved', 'Rejected'])
  status: string;
}
