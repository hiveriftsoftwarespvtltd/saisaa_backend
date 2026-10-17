import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type InquiryDocument = HydratedDocument<Inquiry>;

export enum InquiryStatus {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  ARCHIVED = 'Archived',
}

@Schema({
  collection: 'inquiries',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret.__v;
      return ret;
    },
  },
})
export class Inquiry extends BaseDocument {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(InquiryStatus),
    default: InquiryStatus.NEW,
    index: true,
  })
  status: string;

  @Prop({ trim: true, default: '' })
  notes: string;

  @Prop({ trim: true, default: '' })
  date: string;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);

InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ email: 1, createdAt: -1 });
