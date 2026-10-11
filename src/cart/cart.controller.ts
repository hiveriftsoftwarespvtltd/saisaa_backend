import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { SyncCartDto } from './dto/sync-cart.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ResponseMessage('Cart retrieved successfully')
  async getCart(@Query('email') email: string, @Req() req: any) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.cartService.getCart(userEmail);
  }

  @Post('sync')
  @ResponseMessage('Cart synchronized successfully')
  async syncCart(@Body() syncDto: SyncCartDto, @Req() req: any) {
    const userEmail = syncDto.userEmail || req?.user?.email || 'guest@saisaa.com';
    return this.cartService.syncCart(userEmail, syncDto.items);
  }

  @Post('items')
  @ResponseMessage('Item added to cart successfully')
  async addItem(
    @Body() body: { item: any; userEmail?: string },
    @Req() req: any,
  ) {
    const userEmail = body.userEmail || req?.user?.email || 'guest@saisaa.com';
    return this.cartService.addItem(userEmail, body.item);
  }

  @Delete('items/:itemKey')
  @ResponseMessage('Item removed from cart successfully')
  async removeItem(
    @Param('itemKey') itemKey: string,
    @Query('email') email: string,
    @Req() req: any,
  ) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.cartService.removeItem(userEmail, itemKey);
  }

  @Delete()
  @ResponseMessage('Cart cleared successfully')
  async clearCart(@Query('email') email: string, @Req() req: any) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.cartService.clearCart(userEmail);
  }
}
