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
  UseGuards,
} from '@nestjs/common';
import { HeroBannersService } from './hero-banners.service';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import { ReorderHeroBannersDto } from './dto/reorder-hero-banners.dto';
import {
  CreateHeroMarqueeDto,
  UpdateHeroMarqueeDto,
} from './dto/hero-marquee.dto';
import { UpdatePageHeroDto } from './dto/page-hero.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('hero-banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class HeroBannersController {
  constructor(private readonly heroBannersService: HeroBannersService) {}

  // Static / sub-resource routes declared BEFORE parameterized :id routes
  @Public()
  @Get('pages')
  @ResponseMessage('Page hero banners retrieved successfully')
  async findAllPages() {
    return this.heroBannersService.findAllPages();
  }

  @Public()
  @Get('pages/:pageKey')
  @ResponseMessage('Page hero banner retrieved successfully')
  async findPageByKey(@Param('pageKey') pageKey: string) {
    return this.heroBannersService.findPageByKey(pageKey);
  }

  @Put('pages/:pageKey')
  @ResponseMessage('Page hero banner updated successfully')
  async updatePageByKey(
    @Param('pageKey') pageKey: string,
    @Body() dto: UpdatePageHeroDto,
  ) {
    return this.heroBannersService.updatePageByKey(pageKey, dto);
  }

  @Public()
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
  @Public()
  @Get()
  @ResponseMessage('Hero banners retrieved successfully')
  async findAll(@Query('status') status?: string) {
    return this.heroBannersService.findAll(status);
  }

  @Public()
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
