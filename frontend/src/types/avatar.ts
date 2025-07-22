// 백엔드 데이터 구조에 맞춘 새로운 타입 정의

// 색상 정보
export interface ColorInfo {
  colorName: string;
  imageUrl: string;
  paletteImageUrl: string;
  _id: string;
}

// 아바타 선택 요소 (얼굴 파츠)
export interface AvatarSelectionItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  color?: ColorInfo[];
}

// 아바타 선택 맵 (face, hair, brow, eyes, nose, mouth 등)
export interface AvatarSelections {
  [key: string]: AvatarSelectionItem;
}

// 역할/스티커 아이템
export interface ItemInfo {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  category?: string;
}

// 메인 사용자 아바타 데이터 (백엔드와 동일한 구조)
export interface UserAvatarData {
  id: string;
  nameEn: string;
  email: string;
  nameKr: string;
  part: string;
  phone: string;
  isNamecardActive: boolean;
  arId: string;
  isAdmin: boolean;
  avatarSelections: AvatarSelections;
  role?: ItemInfo;
  item1?: ItemInfo;
  item2?: ItemInfo;
  item3?: ItemInfo;
  avatarImgUrl?: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

// 백엔드 API 응답용 캐릭터 옵션
export interface BackendCharacterOption {
  _id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  color?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 백엔드 API 응답용 캐릭터 카테고리
export interface BackendCharacterCategory {
  _id: string;
  name: string;
  type: string;
  options: BackendCharacterOption[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 백엔드 API 응답용 스티커 아이템
export interface BackendStickerItem {
  _id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  animationUrl?: string;
  animation?: {
    frames: number;
    columns: number;
    duration: number;
    type: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 백엔드 API 응답용 스티커 카테고리
export interface BackendStickerCategory {
  _id: string;
  name: string;
  type: string; // "role" 또는 "sticker"
  items: BackendStickerItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입들
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 빈 사용자 아바타 템플릿
export const createEmptyUserAvatar = (): UserAvatarData => ({
  id: "",
  nameEn: "",
  email: "",
  nameKr: "",
  part: "",
  phone: "",
  isNamecardActive: false,
  arId: "",
  isAdmin: false,
  avatarSelections: {},
  message: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// 레거시 호환용 (기존 컴포넌트들이 사용 중)
export interface AvatarData extends UserAvatarData {
  // 기존 컴포넌트 호환을 위한 별칭
}

// 프론트엔드 전용 - 스티커 배치 정보 (3D 좌표용)
export interface StickerPlacement {
  itemId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale?: number;
  rotation?: number;
}