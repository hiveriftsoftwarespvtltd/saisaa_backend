import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInquiryDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString()
  message: string;
}
