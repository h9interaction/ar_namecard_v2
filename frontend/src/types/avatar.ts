// 얼굴 구성요소 타입 정의
export interface FaceElements {
  bang: string | null;      // 앞머리
  brows: string | null;     // 눈썹
  eyes: string | null;      // 눈
  glasses: string | null;   // 안경
  hair: string | null;      // 중간머리
  hairback: string | null;  // 뒷머리
  mouth: string | null;     // 입
  nose: string | null;      // 코
  shape: string | null;     // 얼굴형
}

// 스프라이트(스티커) 타입 정의
export interface SpriteElement {
  id: string;
  image: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale?: number;
  rotation?: number;
}

// 아바타 데이터 구조
export interface AvatarData {
  id: string;
  name: string;
  face: FaceElements;
  sprites: SpriteElement[];  // 최대 3개
  createdAt: Date;
  updatedAt: Date;
}

// 아바타 생성/수정용 타입
export interface AvatarInput {
  name: string;
  face: Partial<FaceElements>;
  sprites: SpriteElement[];
}

// 아바타 프리셋 타입
export interface AvatarPreset {
  id: string;
  name: string;
  thumbnail: string;
  data: AvatarInput;
}

// 아바타 에셋 카테고리
export interface AssetCategory {
  id: string;
  name: string;
  type: 'face' | 'sprite';
  items: AssetItem[];
}

export interface AssetItem {
  id: string;
  name: string;
  image: string;
  category: string;
  tags?: string[];
}