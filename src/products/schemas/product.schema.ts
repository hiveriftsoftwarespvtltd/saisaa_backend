import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  collection: 'products',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret.customId || ret._id.toString();
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret.customId || ret._id.toString();
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Product extends BaseDocument {
  @Prop({ unique: true, sparse: true, index: true, trim: true })
  customId?: string;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ lowercase: true, trim: true, index: true })
  slug?: string;

  @Prop({ uppercase: true, trim: true, sparse: true })
  sku?: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  category: string; // suits | sarees | kurtis

  @Prop({ trim: true, index: true })
  subCategory?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0, default: null })
  originalPrice?: number;

  @Prop({ default: 4.8, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: false, index: true })
  isBestSeller: boolean;

  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop({ default: false, index: true })
  isNewArrival: boolean;

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ default: false })
  comingSoon: boolean;

  @Prop({ default: 10, min: 0 })
  stock: number;

  @Prop({ default: 5, min: 0 })
  lowStockThreshold?: number;

  @Prop({ default: 0, min: 0 })
  discount?: number;

  @Prop({ trim: true })
  fabric?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ trim: true })
  colorHex?: string;

  @Prop({ trim: true })
  work?: string;

  @Prop({ trim: true })
  care?: string;

  @Prop({ default: false, index: true })
  isFreeSize: boolean;

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: [Object], default: [] })
  sizeVariants?: {
    size: string;
    price: number;
    originalPrice?: number;
    stock?: number;
  }[];

  @Prop({ trim: true, default: '' })
  cardImage?: string;

  @Prop({ trim: true, default: '' })
  coverImage?: string;

  @Prop({ trim: true, default: '' })
  homeImage?: string;

  @Prop({ trim: true, default: '' })
  originalImage?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: 'Active', enum: ['Active', 'Draft', 'Archived'] })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text indexing for fast search
ProductSchema.index({
  name: 'text',
  fabric: 'text',
  category: 'text',
  work: 'text',
  description: 'text',
});
