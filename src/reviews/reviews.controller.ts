import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ResponseMessage('Reviews list retrieved successfully')
  async findAll(@Query() query: any) {
    return this.reviewsService.findAll(query);
  }

  @Get('product/:productId')
  @ResponseMessage('Product reviews retrieved successfully')
  async findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('eligibility')
  @ResponseMessage('Review eligibility checked')
  async checkEligibility(
    @Query('productId') productId: string,
    @Query('email') email: string,
  ) {
    return this.reviewsService.checkEligibility(productId, email);
  }

  @Post()
  @ResponseMessage('Review submitted successfully')
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Put(':id/status')
  @ResponseMessage('Review status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ResponseMessage('Review removed successfully')
  async remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
