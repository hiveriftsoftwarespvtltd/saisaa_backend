import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from './base.schema';

export type SampleProductDocument = HydratedDocument<SampleProduct>;

/**
 * Example Domain Schema for SAISAA Luxury Collections
 * Demonstrates NestJS @Schema, @Prop, indexes, validation, and SchemaFactory
 */
@Schema({
  collection: 'products',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class SampleProduct extends BaseDocument {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ required: true, index: true })
  category: string; // Suits | Kurtis | Sarees

  @Prop({ index: true })
  subCategory: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  originalPrice?: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ trim: true })
  fabric?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ default: false })
  isBestSeller: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({ default: 'Active', enum: ['Active', 'Draft', 'Archived'] })
  status: string;
}

export const SampleProductSchema = SchemaFactory.createForClass(SampleProduct);

// Text search indexes for high performance querying
SampleProductSchema.index({ name: 'text', fabric: 'text', category: 'text' });
