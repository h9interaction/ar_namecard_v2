import type { 
  CharacterCategory, 
  StickerCategory, 
  CharacterOption,
  StickerItem,
  AvatarData,
  FaceElements 
} from '../types/avatar';

// 백엔드 데이터에서 랜덤 캐릭터 선택
export function generateRandomCharacterSelections(characterCategories: CharacterCategory[]): FaceElements {
  const selections: FaceElements = {};
  
  for (const category of characterCategories) {
    if (category.options && category.options.length > 0) {
      const randomOption = getRandomItem(category.options);
      selections[category.type] = randomOption._id || randomOption.name;
    }
  }
  
  return selections;
}

// 백엔드 데이터에서 랜덤 스티커 선택 (최대 3개)
export function generateRandomStickerSelections(stickerCategories: StickerCategory[]): {
  sticker1?: string;
  sticker2?: string;
  sticker3?: string;
} {
  // 모든 스티커 아이템을 하나의 배열로 합치기
  const allStickers: StickerItem[] = [];
  stickerCategories.forEach(category => {
    if (category.items) {
      allStickers.push(...category.items);
    }
  });

  if (allStickers.length === 0) {
    return {};
  }

  // 랜덤하게 1-3개 스티커 선택
  const stickerCount = Math.min(Math.floor(Math.random() * 3) + 1, allStickers.length);
  const selectedStickers = getRandomItems(allStickers, stickerCount);
  
  const result: { sticker1?: string; sticker2?: string; sticker3?: string } = {};
  
  selectedStickers.forEach((sticker, index) => {
    const stickerKey = `sticker${index + 1}` as 'sticker1' | 'sticker2' | 'sticker3';
    result[stickerKey] = sticker._id || sticker.name;
  });
  
  return result;
}

// 백엔드 데이터 기반으로 랜덤 아바타 생성
export function generateRandomAvatarFromBackend(
  characterCategories: CharacterCategory[], 
  stickerCategories: StickerCategory[]
): AvatarData {
  const characterSelections = generateRandomCharacterSelections(characterCategories);
  const stickerSelections = generateRandomStickerSelections(stickerCategories);
  
  const avatarData: AvatarData = {
    id: `temp_${Date.now()}`, // 임시 ID
    characterSelections,
    ...stickerSelections,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return avatarData;
}

// 캐릭터 옵션 ID로 실제 옵션 찾기
export function findCharacterOption(
  categories: CharacterCategory[], 
  categoryType: string, 
  optionId: string
): CharacterOption | null {
  const category = categories.find(cat => cat.type === categoryType);
  if (!category) return null;
  
  return category.options.find(option => 
    (option._id && option._id === optionId) || option.name === optionId
  ) || null;
}

// 스티커 아이템 ID로 실제 아이템 찾기
export function findStickerItem(
  categories: StickerCategory[], 
  itemId: string
): StickerItem | null {
  for (const category of categories) {
    const item = category.items.find(item => 
      (item._id && item._id === itemId) || item.name === itemId
    );
    if (item) return item;
  }
  return null;
}

// 유틸리티 함수들
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}