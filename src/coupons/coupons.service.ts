import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCoupons();
  }

  private async seedDefaultCoupons() {
    const defaultCoupons = [
      {
        code: 'SAISAAFIRST',
        type: 'Percentage',
        value: 15,
        discount: '15%',
        minimumOrder: 2999,
        maximumDiscount: 2000,
        usageLimit: 1000,
        usedCount: 142,
        validFrom: 'Today',
        validUntil: '31 Dec 2026',
        status: 'Active',
        description: '15% Royal Welcome Offer for new patrons.',
      },
      {
        code: 'ROYAL10',
        type: 'Percentage',
        value: 10,
        discount: '10%',
        minimumOrder: 1999,
        maximumDiscount: 1500,
        usageLimit: 2500,
        usedCount: 388,
        validFrom: 'Today',
        validUntil: '31 Dec 2026',
        status: 'Active',
        description: '10% discount for Royal Heritage Club patrons.',
      },
      {
        code: 'SHAHI500',
        type: 'Fixed',
        value: 500,
        discount: '₹500',
        minimumOrder: 3499,
        maximumDiscount: 500,
        usageLimit: 800,
        usedCount: 95,
        validFrom: 'Today',
        validUntil: '31 Dec 2026',
        status: 'Active',
        description: 'Flat ₹500 off on festive couture orders.',
      },
      {
        code: 'FESTIVE20',
        type: 'Percentage',
        value: 20,
        discount: '20%',
        minimumOrder: 5999,
        maximumDiscount: 3000,
        usageLimit: 500,
        usedCount: 64,
        validFrom: 'Today',
        validUntil: '31 Dec 2026',
        status: 'Active',
        description: '20% off on grand celebrations and wedding orders.',
      },
    ];

    for (const c of defaultCoupons) {
      const exists = await this.couponModel.findOne({ code: c.code });
      if (!exists) {
        await this.couponModel.create(c);
      }
    }
  }

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    return this.couponModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(idOrCode: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
    const filter = isObjectId
      ? { _id: idOrCode }
      : { code: idOrCode.toUpperCase().trim() };

    const coupon = await this.couponModel.findOne(filter).exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon "${idOrCode}" not found`);
    }
    return coupon;
  }

  async create(createCouponDto: CreateCouponDto) {
    const cleanCode = createCouponDto.code.trim().toUpperCase();
    const existing = await this.couponModel.findOne({ code: cleanCode }).exec();
    if (existing) {
      throw new ConflictException(`Coupon code "${cleanCode}" already exists`);
    }

    const type = createCouponDto.type || 'Percentage';
    const isPercent =
      type.toLowerCase() === 'percentage' || type.toLowerCase() === 'percent';
    const discount =
      createCouponDto.discount ||
      (isPercent ? `${createCouponDto.value}%` : `₹${createCouponDto.value}`);

    const created = new this.couponModel({
      ...createCouponDto,
      code: cleanCode,
      type: isPercent ? 'Percentage' : 'Fixed',
      discount,
      status: createCouponDto.status || 'Active',
      usedCount: 0,
    });

    return created.save();
  }

  async remove(idOrCode: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
    const filter = isObjectId
      ? { _id: idOrCode }
      : { code: idOrCode.toUpperCase().trim() };

    const deleted = await this.couponModel.findOneAndDelete(filter).exec();
    if (!deleted) {
      throw new NotFoundException(`Coupon "${idOrCode}" not found`);
    }
    return { success: true, message: `Coupon removed successfully` };
  }

  async validate(dto: ValidateCouponDto) {
    const cleanCode = dto.code.trim().toUpperCase();
    const coupon = await this.couponModel.findOne({ code: cleanCode }).exec();

    if (!coupon || coupon.status !== 'Active') {
      throw new BadRequestException('Invalid or inactive royal promo code');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon usage limit has been reached');
    }

    const orderAmount = Number(dto.orderAmount) || 0;
    if (coupon.minimumOrder > 0 && orderAmount < coupon.minimumOrder) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minimumOrder.toLocaleString('en-IN')} required to use code "${coupon.code}"`,
      );
    }

    const isPercent =
      coupon.type.toLowerCase() === 'percentage' ||
      coupon.type.toLowerCase() === 'percent';

    let discountAmount = 0;
    if (isPercent) {
      discountAmount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    return {
      valid: true,
      code: coupon.code,
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
      label: coupon.description || `${coupon.discount} Discount Applied`,
      coupon: {
        id: coupon._id.toString(),
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: coupon.discount,
        minimumOrder: coupon.minimumOrder,
        maximumDiscount: coupon.maximumDiscount,
      },
    };
  }

  async recordUsage(code: string) {
    const cleanCode = code.trim().toUpperCase();
    await this.couponModel.updateOne(
      { code: cleanCode },
      { $inc: { usedCount: 1 } },
    );
  }
}
