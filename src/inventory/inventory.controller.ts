import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ResponseMessage('Inventory directory retrieved successfully')
  async findAll(@Query() query: any) {
    return this.inventoryService.findAll(query);
  }

  @Get('summary')
  @ResponseMessage('Inventory summary metrics retrieved successfully')
  async getSummary() {
    return this.inventoryService.getSummary();
  }

  @Put(':sku')
  @ResponseMessage('Physical stock adjusted successfully')
  async adjustStock(
    @Param('sku') sku: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(sku, adjustStockDto);
  }

  @Patch(':sku/stock')
  @ResponseMessage('Physical stock adjusted successfully')
  async patchStock(
    @Param('sku') sku: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(sku, adjustStockDto);
  }
}
