import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SubCategoryDto } from './dto/sub-category.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ResponseMessage('Categories retrieved successfully')
  async findAll(@Query('status') status?: string) {
    return this.categoriesService.findAll(status);
  }

  @Get(':idOrSlug')
  @ResponseMessage('Category retrieved successfully')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.categoriesService.findOne(idOrSlug);
  }

  @Post()
  @ResponseMessage('Category created successfully')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @ResponseMessage('Category updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ResponseMessage('Category deleted successfully')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post(':idOrSlug/subcategories')
  @ResponseMessage('Subcategory added successfully')
  async addSubCategory(
    @Param('idOrSlug') idOrSlug: string,
    @Body() subCategoryDto: SubCategoryDto,
  ) {
    return this.categoriesService.addSubCategory(idOrSlug, subCategoryDto);
  }

  @Delete(':idOrSlug/subcategories/:name')
  @ResponseMessage('Subcategory removed successfully')
  async removeSubCategory(
    @Param('idOrSlug') idOrSlug: string,
    @Param('name') name: string,
  ) {
    return this.categoriesService.removeSubCategory(idOrSlug, name);
  }
}
