import { Schema, model, Document, Types } from 'mongoose';

export interface IUserCustomization extends Document {
  id: Types.ObjectId;
  avatarSelections: Map<string, string>;
  role?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  avatarImgUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userCustomizationSchema = new Schema<IUserCustomization>({
  id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  avatarSelections: {
    type: Map,
    of: String,
    default: () => new Map()
  },
  role: {
    type: String,
    trim: true
  },
  item1: {
    type: String,
    trim: true
  },
  item2: {
    type: String,
    trim: true
  },
  item3: {
    type: String,
    trim: true
  },
  avatarImgUrl: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret: any) {
      if (ret.avatarSelections) {
        ret.avatarSelections = Object.fromEntries(ret.avatarSelections);
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

userCustomizationSchema.index({ createdAt: -1 });

export const UserCustomization = model<IUserCustomization>('UserCustomization', userCustomizationSchema);