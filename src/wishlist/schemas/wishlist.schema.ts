import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({
  collection: 'wishlists',
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
export class Wishlist extends BaseDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  userEmail: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  products: any[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
