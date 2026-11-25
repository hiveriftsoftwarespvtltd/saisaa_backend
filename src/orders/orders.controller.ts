import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateRazorpayOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ResponseMessage('Order placed successfully')
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const userEmail = req?.user?.email;
    return this.ordersService.create(createOrderDto, userEmail);
  }

  // ==========================================
  // RAZORPAY PAYMENT ENDPOINTS
  // ==========================================

  @Get('razorpay/key')
  @ResponseMessage('Razorpay public key')
  async getRazorpayKey() {
    return this.ordersService.getRazorpayKey();
  }

  @Post('razorpay/create-order')
  @ResponseMessage('Razorpay order created successfully')
  async createRazorpayOrder(
    @Body() body: CreateRazorpayOrderDto,
  ) {
    return this.ordersService.createRazorpayOrder(body);
  }

  @Post('razorpay/verify')
  @ResponseMessage('Payment verified and order placed successfully')
  async verifyRazorpayPayment(@Body() body: any, @Req() req: any) {
    const userEmail = req?.user?.email;
    return this.ordersService.verifyRazorpayPayment(body, userEmail);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ResponseMessage('Orders retrieved successfully')
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User orders retrieved successfully')
  async findMyOrders(@Query('email') email: string, @Req() req: any) {
    const requester = req.user;
    if (!requester || !requester.email) {
      return [];
    }

    // Admins may query any customer's orders; standard customers strictly query their own authenticated email
    const userEmail =
      requester.role === 'admin' && email
        ? email.trim().toLowerCase()
        : requester.email.trim().toLowerCase();

    return this.ordersService.findByUser(userEmail);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Order retrieved successfully')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    const requester = req.user;

    if (!requester) {
      throw new ForbiddenException('Authentication required');
    }

    if (requester.role !== 'admin') {
      const orderUserEmail = (order.userEmail || '').trim().toLowerCase();
      const orderCustomerEmail = (order.customer?.email || '').trim().toLowerCase();
      const requesterEmail = (requester.email || '').trim().toLowerCase();

      if (orderUserEmail !== requesterEmail && orderCustomerEmail !== requesterEmail) {
        throw new ForbiddenException('You do not have permission to view this order');
      }
    }

    return order;
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ResponseMessage('Order status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
