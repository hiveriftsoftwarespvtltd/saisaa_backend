import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  collection: 'categories',
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
export class Category extends BaseDocument {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ default: '/images/02_category_suits.jpg' })
  image?: string;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;

  @Prop({ type: [Object], default: [] })
  subCategories: any[];

  @Prop({ default: 0 })
  productsCount: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
