import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ResponseMessage('Wishlist retrieved successfully')
  async getWishlist(@Query('email') email: string, @Req() req: any) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.wishlistService.getWishlist(userEmail);
  }

  @Post('sync')
  @ResponseMessage('Wishlist synchronized successfully')
  async syncWishlist(@Body() body: SyncWishlistDto, @Req() req: any) {
    const userEmail = body.userEmail || req?.user?.email || 'guest@saisaa.com';
    const itemsToMerge = body.guestProducts || body.products || [];
    return this.wishlistService.syncWishlist(userEmail, itemsToMerge);
  }

  @Put()
  @ResponseMessage('Wishlist updated successfully')
  async replaceWishlist(
    @Body() body: { products: any[]; userEmail?: string },
    @Req() req: any,
  ) {
    const userEmail = body.userEmail || req?.user?.email || 'guest@saisaa.com';
    return this.wishlistService.replaceWishlist(userEmail, body.products || []);
  }

  @Post('toggle')
  @ResponseMessage('Wishlist updated successfully')
  async toggleProduct(
    @Body() body: { product: any; userEmail?: string },
    @Req() req: any,
  ) {
    const userEmail = body.userEmail || req?.user?.email || 'guest@saisaa.com';
    return this.wishlistService.toggleProduct(userEmail, body.product);
  }

  @Delete(':productId')
  @ResponseMessage('Product removed from wishlist successfully')
  async removeProduct(
    @Param('productId') productId: string,
    @Query('email') email: string,
    @Req() req: any,
  ) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.wishlistService.removeProduct(userEmail, productId);
  }

  @Delete()
  @ResponseMessage('Wishlist cleared successfully')
  async clearWishlist(@Query('email') email: string, @Req() req: any) {
    const userEmail = email || req?.user?.email || 'guest@saisaa.com';
    return this.wishlistService.clearWishlist(userEmail);
  }
}
