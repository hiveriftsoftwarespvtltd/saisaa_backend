import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ResponseMessage('Products retrieved successfully')
  async findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug/related')
  @ResponseMessage('Related category products retrieved successfully')
  async findRelated(
    @Param('idOrSlug') idOrSlug: string,
    @Query('limit') limit?: number,
  ) {
    const numLimit = limit ? Number(limit) : 4;
    return this.productsService.findRelated(idOrSlug, numLimit);
  }

  @Get(':idOrSlug')
  @ResponseMessage('Product retrieved successfully')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ResponseMessage('Product created successfully')
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ResponseMessage('Product updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ResponseMessage('Product deleted successfully')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
