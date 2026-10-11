import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({
  collection: 'coupons',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Coupon extends BaseDocument {
  @Prop({ required: true, uppercase: true, unique: true, trim: true, index: true })
  code: string;

  @Prop({ required: true, enum: ['Percentage', 'Fixed', 'percentage', 'flat'], default: 'Percentage' })
  type: string;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ trim: true, default: '' })
  discount?: string;

  @Prop({ min: 0, default: 0 })
  minimumOrder: number;

  @Prop({ min: 0, default: 0 })
  maximumDiscount: number;

  @Prop({ min: 1, default: 1000 })
  usageLimit: number;

  @Prop({ min: 0, default: 0 })
  usedCount: number;

  @Prop({ trim: true, default: 'Today' })
  validFrom: string;

  @Prop({ trim: true, default: '31 Dec 2026' })
  validUntil: string;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive', 'Expired'] })
  status: string;

  @Prop({ trim: true, default: '' })
  description?: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
