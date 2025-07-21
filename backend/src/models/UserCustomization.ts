import { Schema, model, Document, Types } from 'mongoose';

export interface IUserCustomization extends Document {
  id: string;
  avatarSelections: any; // Map<string, string> 또는 객체를 허용
  role?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  avatarImgUrl?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userCustomizationSchema = new Schema<IUserCustomization>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  avatarSelections: {
    type: Schema.Types.Mixed,
    default: {}
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
  },
  message: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret: any) {
      if (ret.avatarSelections) {
        if (ret.avatarSelections instanceof Map) {
          ret.avatarSelections = Object.fromEntries(ret.avatarSelections);
        } else if (typeof ret.avatarSelections === 'object' && ret.avatarSelections !== null) {
          // 이미 객체인 경우 그대로 유지
          ret.avatarSelections = ret.avatarSelections;
        } else {
          ret.avatarSelections = {};
        }
      } else {
        ret.avatarSelections = {};
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

userCustomizationSchema.index({ createdAt: -1 });

export const UserCustomization = model<IUserCustomization>('UserCustomization', userCustomizationSchema);