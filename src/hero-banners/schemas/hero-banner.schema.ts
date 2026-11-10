import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type HeroBannerDocument = HydratedDocument<HeroBanner>;
export type HeroMarqueeDocument = HydratedDocument<HeroMarquee>;
export type PageHeroDocument = HydratedDocument<PageHero>;

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
export class HeroBanner extends BaseDocument {
  @Prop({ required: true, default: 'hero_slide' })
  cmsType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail: string;

  @Prop({ required: true, trim: true })
  image: string;

  @Prop({ trim: true, default: '' })
  mobileImage?: string;

  @Prop({ trim: true, default: '' })
  eyebrow?: string;

  @Prop({ trim: true, default: '' })
  title?: string;

  @Prop({ trim: true, default: '' })
  subtitle?: string;

  @Prop({ trim: true, default: '' })
  ctaText?: string;

  @Prop({ trim: true, default: '/shop' })
  ctaLink?: string;

  @Prop({ default: 'serif', enum: ['serif', 'script'] })
  titleStyle: string;

  @Prop({
    default: 'center',
    enum: ['center', 'bottom', 'split-badge', 'clean'],
  })
  layoutPreset: string;

  @Prop({
    default: 'bottom',
    enum: ['dark', 'bottom', 'light', 'none'],
  })
  overlayScrim: string;

  @Prop({ trim: true, default: 'center' })
  objectPosition?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const HeroBannerSchema = SchemaFactory.createForClass(HeroBanner);

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
export class HeroMarquee extends BaseDocument {
  @Prop({ required: true, default: 'hero_marquee' })
  cmsType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail: string;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const HeroMarqueeSchema = SchemaFactory.createForClass(HeroMarquee);

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
export class PageHero extends BaseDocument {
  @Prop({ required: true, default: 'page_hero' })
  cmsType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail: string;

  @Prop({
    required: true,
    enum: ['stitched-suits', 'unstitched-suits', 'sarees', 'about', 'contact'],
  })
  pageKey: string;

  @Prop({ required: true, trim: true })
  pageLabel: string;

  @Prop({ required: true, trim: true })
  routePath: string;

  @Prop({ required: true, trim: true })
  image: string;

  @Prop({ trim: true, default: '' })
  mobileImage?: string;

  @Prop({ trim: true, default: '' })
  eyebrow?: string;

  @Prop({ trim: true, default: '' })
  title?: string;

  @Prop({ trim: true, default: '' })
  subtitle?: string;

  @Prop({ trim: true, default: '' })
  ctaText?: string;

  @Prop({ trim: true, default: '' })
  ctaLink?: string;

  @Prop({ default: 'serif', enum: ['serif', 'script'] })
  titleStyle: string;

  @Prop({
    default: 'dark',
    enum: ['dark', 'bottom', 'light', 'none'],
  })
  overlayScrim: string;

  @Prop({ trim: true, default: 'center' })
  objectPosition?: string;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const PageHeroSchema = SchemaFactory.createForClass(PageHero);
