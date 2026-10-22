import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ trim: true, default: '' })
  city?: string;

  @Prop({ trim: true, default: '' })
  state?: string;

  @Prop({ trim: true, default: '' })
  pincode?: string;
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true, trim: true })
  id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: 'Standard' })
  size: string;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ trim: true, default: '/images/hero-model.jpg' })
  image: string;

  @Prop({ default: false })
  customStitching?: boolean;

  @Prop({ default: 0 })
  stitchingFee?: number;
}

@Schema({ _id: false })
export class OrderTimelineEvent {
  @Prop({ required: true, trim: true })
  status: string;

  @Prop({ required: true, trim: true })
  date: string;

  @Prop({ default: false })
  done: boolean;
}

@Schema({
  collection: 'orders',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret.orderId || ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret.orderId || ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Order extends BaseDocument {
  @Prop({ required: true, unique: true, index: true, trim: true })
  orderId: string; // e.g. SAI12568, SAI-2026-90412

  @Prop({ trim: true, index: true })
  userEmail?: string;

  @Prop({ type: CustomerInfo, required: true })
  customer: CustomerInfo;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({ required: true, trim: true })
  date: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ trim: true, default: '' })
  couponCode?: string;

  @Prop({ default: 0, min: 0 })
  shipping: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  grandTotal: number;

  @Prop({ required: true, default: 'UPI', trim: true })
  paymentMethod: string; // UPI, Credit Card, COD, Net Banking

  @Prop({ trim: true, default: '' })
  transactionId?: string;

  @Prop({ trim: true, default: '' })
  razorpayOrderId?: string;

  @Prop({ trim: true, default: '' })
  razorpayPaymentId?: string;

  @Prop({ trim: true, default: '' })
  razorpaySignature?: string;

  @Prop({
    required: true,
    default: 'Pending',
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
  })
  paymentStatus: string;

  @Prop({
    required: true,
    default: 'Pending',
    enum: [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Returned',
    ],
    index: true,
  })
  orderStatus: string;

  @Prop({ type: [OrderTimelineEvent], default: [] })
  timeline: OrderTimelineEvent[];

  @Prop({ trim: true, default: '' })
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
