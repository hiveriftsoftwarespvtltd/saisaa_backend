import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type EditorialBannerDocument = HydratedDocument<EditorialBanner>;
export type OurStoryDocument = HydratedDocument<OurStory>;

// Stored inside existing `wishlists` collection with `cmsType` discriminator
// to stay within Atlas M0 collection limits without impacting user wishlists.
@Schema({
  collection: 'wishlists',
  autoIndex: false,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.userEmail;
      delete ret.cmsType;
      return ret;
    },
  },
})
export class EditorialBanner extends BaseDocument {
  @Prop({ required: true, default: 'editorial_banner' })
  cmsType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail: string;

  @Prop({ required: true, trim: true })
  image: string;

  @Prop({ trim: true, default: '' })
  eyebrow?: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ trim: true, default: 'Explore Collection' })
  ctaText?: string;

  @Prop({ trim: true, default: '/shop' })
  ctaLink?: string;

  @Prop({ default: 'ivory', enum: ['ivory', 'emerald', 'blush'] })
  theme: string;

  @Prop({ default: 'left', enum: ['left', 'right'] })
  imagePosition: string;

  @Prop({ trim: true, default: 'center top' })
  objectPosition?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const EditorialBannerSchema =
  SchemaFactory.createForClass(EditorialBanner);

@Schema({
  collection: 'wishlists',
  autoIndex: false,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.userEmail;
      delete ret.cmsType;
      return ret;
    },
  },
})
export class OurStory extends BaseDocument {
  @Prop({ required: true, default: 'our_story' })
  cmsType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail: string;

  @Prop({ trim: true, default: 'OUR STORY' })
  eyebrow?: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: 'Traditional • Beautiful • You' })
  scriptText?: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ trim: true, default: 'Discover Our Story' })
  ctaText?: string;

  @Prop({ trim: true, default: '/about' })
  ctaLink?: string;

  @Prop({ required: true, trim: true })
  image: string;

  @Prop({ trim: true, default: 'center top' })
  objectPosition?: string;

  @Prop({ type: [String], default: ['Style', 'Tradition', 'Confidence'] })
  pillars: string[];

  @Prop({ trim: true, default: 'HANDCRAFTED LEGACY' })
  badgeLabel?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const OurStorySchema = SchemaFactory.createForClass(OurStory);

