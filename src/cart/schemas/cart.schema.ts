import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItemProduct {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: null })
  originalPrice?: number;

  @Prop({ default: '/images/hero-model.jpg' })
  cardImage?: string;

  @Prop({ default: '/images/hero-model.jpg' })
  image?: string;

  @Prop({ default: 'suits' })
  category?: string;
}

@Schema({ _id: false })
export class CartItem {
  @Prop({ required: true, trim: true })
  itemKey: string;

  @Prop({ type: CartItemProduct, required: true })
  product: CartItemProduct;

  @Prop({ default: 'M', trim: true })
  size: string;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({ default: false })
  customStitching: boolean;

  @Prop({ default: 0 })
  stitchingFee: number;

  @Prop({ default: () => Date.now() })
  addedAt: number;
}

@Schema({
  collection: 'carts',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Cart extends BaseDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  userEmail: string;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
