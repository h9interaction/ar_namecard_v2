import { Schema, model, Document } from 'mongoose';

export interface IItemAnimation {
  frames: number;
  columns: number;
  duration: number;
  type: string;
}

export interface IItem {
  name: string;
  imageUrl: string;
  modelUrl?: string;
  animationUrl?: string;
  animation?: IItemAnimation;
  thumbnailUrl?: string;
  thumbnailSource?: 'user' | 'auto';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemCategory extends Document {
  name: string;
  type: string;
  thumbnailUrl?: string;
  thumbnailSource?: 'user' | 'auto';
  items: IItem[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemAnimationSchema = new Schema<IItemAnimation>({
  frames: {
    type: Number,
    required: true
  },
  columns: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const itemSchema = new Schema<IItem>({
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
  animationUrl: {
    type: String,
    trim: true
  },
  animation: {
    type: itemAnimationSchema,
    required: false
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
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  _id: true
});

const itemCategorySchema = new Schema<IItemCategory>({
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
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailSource: {
    type: String,
    enum: ['user', 'auto'],
    default: 'auto'
  },
  items: [itemSchema],
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

itemCategorySchema.index({ order: 1 });
itemCategorySchema.index({ createdAt: -1 });

export const ItemCategory = model<IItemCategory>('ItemCategory', itemCategorySchema);