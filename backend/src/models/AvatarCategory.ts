import { Schema, model, Document } from 'mongoose';

export interface IAvatarOption {
  name: string;
  imageUrl: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  thumbnailSource?: 'user' | 'auto';
  color?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvatarCategory extends Document {
  name: string;
  type: string;
  options: IAvatarOption[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const avatarOptionSchema = new Schema<IAvatarOption>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  modelUrl: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailSource: {
    type: String,
    enum: ['user', 'auto'],
    default: 'auto'
  },
  color: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  _id: true
});

const avatarCategorySchema = new Schema<IAvatarCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  options: [avatarOptionSchema],
  order: {
    type: Number,
    default: 0
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

avatarCategorySchema.index({ order: 1 });
avatarCategorySchema.index({ createdAt: -1 });

export const AvatarCategory = model<IAvatarCategory>('AvatarCategory', avatarCategorySchema);