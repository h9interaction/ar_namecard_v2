import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  nameEn?: string;
  email: string;
  nameKr: string;
  role: string;
  part: string;
  phone: string;
  isNamecardActive: boolean;
  arId: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  nameEn: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  nameKr: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'User',
    trim: true
  },
  part: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isNamecardActive: {
    type: Boolean,
    default: false
  },
  arId: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 3,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.index({ createdAt: -1 });

export const User = model<IUser>('User', userSchema);