import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ResponseMessage('Order placed successfully')
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const userEmail = req?.user?.email;
    return this.ordersService.create(createOrderDto, userEmail);
  }

  @Get()
  @ResponseMessage('Orders retrieved successfully')
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @ResponseMessage('User orders retrieved successfully')
  async findMyOrders(@Query('email') email: string, @Req() req: any) {
    const userEmail = email || req?.user?.email;
    if (!userEmail) {
      return [];
    }
    return this.ordersService.findByUser(userEmail);
  }

  @Get(':id')
  @ResponseMessage('Order retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  @ResponseMessage('Order status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
