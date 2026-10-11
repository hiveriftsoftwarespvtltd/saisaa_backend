import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../../common/schemas/base.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User extends BaseDocument {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true, trim: true })
  customId?: string;

  @Prop({ trim: true, default: '' })
  phone?: string;

  @Prop({ default: 'customer', enum: ['customer', 'admin'] })
  role: string;

  @Prop({ default: 'Active', enum: ['Active', 'VIP', 'Inactive'] })
  status: string;

  @Prop({ default: 'Royal Privé Member' })
  tier: string;

  @Prop({ default: 500 })
  loyaltyPoints: number;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ trim: true, default: '' })
  notes?: string;

  @Prop({ type: [Object], default: [] })
  addresses?: {
    type?: string;
    line?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
