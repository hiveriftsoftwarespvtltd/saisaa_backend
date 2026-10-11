import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Base Schema containing standard timestamp fields and virtual id
 */
@Schema({
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
  toObject: {
    virtuals: true,
  },
})
export abstract class BaseDocument extends Document {
  declare _id: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}
