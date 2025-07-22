import { Schema, model, Document } from 'mongoose';

export interface IHairResourceImages {
  hairMiddleImageUrl: string;  // 중간머리 이미지 URL (필수)
  hairBackImageUrl?: string;   // 뒷머리 이미지 URL (선택사항)
}

export interface IColorOption {
  colorName: string;
  imageUrl: string;
  paletteImageUrl?: string;
  resourceImages?: IHairResourceImages;  // hair 카테고리용 리소스 이미지 객체
}

export interface IHairParts {
  middle: string;    // 중간머리 이미지 URL (필수)
  back?: string;     // 뒷머리 이미지 URL (선택사항)
}

export interface IAvatarOption {
  name: string;
  imageUrl: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  thumbnailSource?: 'user' | 'auto';
  color?: IColorOption[];
  hairParts?: IHairParts;  // hair 카테고리 전용 필드
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
  color: [{
    colorName: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    paletteImageUrl: {
      type: String,
      trim: true
    },
    resourceImages: {
      hairMiddleImageUrl: {
        type: String,
        trim: true
      },
      hairBackImageUrl: {
        type: String,
        trim: true
      }
    }
  }],
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