import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ContentService } from './content.service';
import {
  CreateEditorialBannerDto,
  ReorderContentDto,
  UpdateEditorialBannerDto,
} from './dto/editorial-banner.dto';
import { CreateOurStoryDto, UpdateOurStoryDto } from './dto/our-story.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ==================== EDITORIAL BANNERS ====================

  @Get('editorial-banners')
  @ResponseMessage('Editorial banners retrieved successfully')
  async findAllEditorialBanners(@Query('status') status?: string) {
    return this.contentService.findAllEditorialBanners(status);
  }

  @Patch('editorial-banners/reorder')
  @ResponseMessage('Editorial banners reordered successfully')
  async reorderEditorialBanners(@Body() dto: ReorderContentDto) {
    return this.contentService.reorderEditorialBanners(dto.orderedIds);
  }

  @Get('editorial-banners/:id')
  @ResponseMessage('Editorial banner retrieved successfully')
  async findOneEditorialBanner(@Param('id') id: string) {
    return this.contentService.findOneEditorialBanner(id);
  }

  @Post('editorial-banners')
  @ResponseMessage('Editorial banner created successfully')
  async createEditorialBanner(@Body() dto: CreateEditorialBannerDto) {
    return this.contentService.createEditorialBanner(dto);
  }

  @Put('editorial-banners/:id')
  @ResponseMessage('Editorial banner updated successfully')
  async updateEditorialBanner(
    @Param('id') id: string,
    @Body() dto: UpdateEditorialBannerDto,
  ) {
    return this.contentService.updateEditorialBanner(id, dto);
  }

  @Delete('editorial-banners/:id')
  @ResponseMessage('Editorial banner deleted successfully')
  async removeEditorialBanner(@Param('id') id: string) {
    return this.contentService.removeEditorialBanner(id);
  }

  // ==================== OUR STORY ====================

  @Get('our-story')
  @ResponseMessage('Our Story entries retrieved successfully')
  async findAllOurStories(@Query('status') status?: string) {
    return this.contentService.findAllOurStories(status);
  }

  @Patch('our-story/reorder')
  @ResponseMessage('Our Story entries reordered successfully')
  async reorderOurStories(@Body() dto: ReorderContentDto) {
    return this.contentService.reorderOurStories(dto.orderedIds);
  }

  @Get('our-story/:id')
  @ResponseMessage('Our Story entry retrieved successfully')
  async findOneOurStory(@Param('id') id: string) {
    return this.contentService.findOneOurStory(id);
  }

  @Post('our-story')
  @ResponseMessage('Our Story entry created successfully')
  async createOurStory(@Body() dto: CreateOurStoryDto) {
    return this.contentService.createOurStory(dto);
  }

  @Put('our-story/:id')
  @ResponseMessage('Our Story entry updated successfully')
  async updateOurStory(
    @Param('id') id: string,
    @Body() dto: UpdateOurStoryDto,
  ) {
    return this.contentService.updateOurStory(id, dto);
  }

  @Delete('our-story/:id')
  @ResponseMessage('Our Story entry deleted successfully')
  async removeOurStory(@Param('id') id: string) {
    return this.contentService.removeOurStory(id);
  }
}

