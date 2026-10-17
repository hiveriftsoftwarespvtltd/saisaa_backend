import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  /**
   * Submit inquiry from public contact page
   */
  @Post()
  @ResponseMessage('Your royal consultation request has been received. Our concierge will contact you shortly.')
  async create(@Body() createInquiryDto: CreateInquiryDto) {
    return this.inquiriesService.create(createInquiryDto);
  }

  /**
   * Retrieve all inquiries for admin dashboard
   */
  @Get()
  @ResponseMessage('Inquiries retrieved successfully')
  async findAll(@Query() query: any) {
    return this.inquiriesService.findAll(query);
  }

  /**
   * Retrieve single inquiry details
   */
  @Get(':id')
  @ResponseMessage('Inquiry details retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  /**
   * Update inquiry status and notes (PUT / PATCH supported)
   */
  @Put(':id/status')
  @ResponseMessage('Inquiry status updated successfully')
  async updateStatusPut(
    @Param('id') id: string,
    @Body() updateDto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(id, updateDto);
  }

  @Patch(':id/status')
  @ResponseMessage('Inquiry status updated successfully')
  async updateStatusPatch(
    @Param('id') id: string,
    @Body() updateDto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(id, updateDto);
  }

  /**
   * Delete an inquiry
   */
  @Delete(':id')
  @ResponseMessage('Inquiry deleted successfully')
  async remove(@Param('id') id: string) {
    return this.inquiriesService.remove(id);
  }
}
