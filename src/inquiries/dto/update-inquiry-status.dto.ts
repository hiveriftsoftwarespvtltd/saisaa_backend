import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InquiryStatus } from '../schemas/inquiry.schema';

export class UpdateInquiryStatusDto {
  @IsEnum(InquiryStatus, {
    message: 'Status must be one of: New, In Progress, Resolved, Archived',
  })
  status: InquiryStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
