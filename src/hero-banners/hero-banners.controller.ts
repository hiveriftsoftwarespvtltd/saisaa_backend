import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { HeroBannersService } from './hero-banners.service';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import { ReorderHeroBannersDto } from './dto/reorder-hero-banners.dto';
import {
  CreateHeroMarqueeDto,
  UpdateHeroMarqueeDto,
} from './dto/hero-marquee.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('hero-banners')
export class HeroBannersController {
  constructor(private readonly heroBannersService: HeroBannersService) {}

  // Static / sub-resource routes declared BEFORE parameterized :id routes
  @Get('marquee')
  @ResponseMessage('Hero marquee highlights retrieved successfully')
  async findAllMarquee(@Query('status') status?: string) {
    return this.heroBannersService.findAllMarquee(status);
  }

  @Post('marquee')
  @ResponseMessage('Hero marquee highlight created successfully')
  async createMarquee(@Body() dto: CreateHeroMarqueeDto) {
    return this.heroBannersService.createMarquee(dto);
  }

  @Put('marquee/:id')
  @ResponseMessage('Hero marquee highlight updated successfully')
  async updateMarquee(
    @Param('id') id: string,
    @Body() dto: UpdateHeroMarqueeDto,
  ) {
    return this.heroBannersService.updateMarquee(id, dto);
  }

  @Delete('marquee/:id')
  @ResponseMessage('Hero marquee highlight deleted successfully')
  async removeMarquee(@Param('id') id: string) {
    return this.heroBannersService.removeMarquee(id);
  }

  @Patch('reorder')
  @ResponseMessage('Hero banners reordered successfully')
  async reorder(@Body() dto: ReorderHeroBannersDto) {
    return this.heroBannersService.reorder(dto.orderedIds);
  }

  // Primary Hero Slides CRUD
  @Get()
  @ResponseMessage('Hero banners retrieved successfully')
  async findAll(@Query('status') status?: string) {
    return this.heroBannersService.findAll(status);
  }

  @Get(':id')
  @ResponseMessage('Hero banner retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.heroBannersService.findOne(id);
  }

  @Post()
  @ResponseMessage('Hero banner created successfully')
  async create(@Body() createHeroBannerDto: CreateHeroBannerDto) {
    return this.heroBannersService.create(createHeroBannerDto);
  }

  @Put(':id')
  @ResponseMessage('Hero banner updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateHeroBannerDto: UpdateHeroBannerDto,
  ) {
    return this.heroBannersService.update(id, updateHeroBannerDto);
  }

  @Delete(':id')
  @ResponseMessage('Hero banner deleted successfully')
  async remove(@Param('id') id: string) {
    return this.heroBannersService.remove(id);
  }
}

