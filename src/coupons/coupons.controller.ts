import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ResponseMessage('Coupons list retrieved successfully')
  async findAll(@Query() query: any) {
    return this.couponsService.findAll(query);
  }

  @Post('validate')
  @ResponseMessage('Coupon validated successfully')
  async validate(@Body() validateCouponDto: ValidateCouponDto) {
    return this.couponsService.validate(validateCouponDto);
  }

  @Get(':id')
  @ResponseMessage('Coupon retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  @ResponseMessage('Coupon created successfully')
  async create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Delete(':id')
  @ResponseMessage('Coupon removed successfully')
  async remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
