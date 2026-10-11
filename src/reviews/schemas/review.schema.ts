import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  collection: 'reviews',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Review extends BaseDocument {
  @Prop({ required: true, trim: true, index: true })
  productId: string;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ trim: true, default: '' })
  productImage: string;

  @Prop({ required: true, trim: true })
  customer: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  customerEmail: string;

  @Prop({ required: true, min: 1, max: 5, default: 5 })
  rating: number;

  @Prop({ trim: true, default: '' })
  title: string;

  @Prop({ required: true, trim: true })
  review: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  verifiedPurchase: boolean;

  @Prop({
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true,
  })
  status: string;

  @Prop({ trim: true, default: '' })
  date: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound indexes for optimized querying
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ customerEmail: 1, productId: 1 });
