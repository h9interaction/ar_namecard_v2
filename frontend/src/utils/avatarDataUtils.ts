import type { 
  BackendCharacterCategory,
  BackendStickerCategory, 
  BackendCharacterOption,
  BackendStickerItem,
  UserAvatarData,
  AvatarSelectionItem,
  ItemInfo
} from '../types/avatar';

// 백엔드 데이터에서 랜덤 아바타 생성
export function generateRandomAvatarFromBackendData(
  characterCategories: BackendCharacterCategory[], 
  stickerCategories: BackendStickerCategory[]
): UserAvatarData {
  console.log('[Backend] 랜덤 아바타 생성 시작');
  console.log(`[Backend] 캐릭터 카테고리: ${characterCategories.length}개`);
  console.log(`[Backend] 스티커 카테고리: ${stickerCategories.length}개`);

  // 빈 아바타 템플릿 생성
  const avatar: UserAvatarData = {
    id: `temp_${Date.now()}`,
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
  };

  // 1. 얼굴 파츠 랜덤 선택 (avatarSelections)
  characterCategories.forEach(category => {
    if (category.options && category.options.length > 0) {
      const randomOption = getRandomItem(category.options);
      
      avatar.avatarSelections[category.type] = {
        id: randomOption._id,
        name: randomOption.name,
        imageUrl: randomOption.imageUrl,
        thumbnailUrl: randomOption.thumbnailUrl || ""
      };
      
      console.log(`[Backend] ${category.name}(${category.type}): ${randomOption.name}`);
    }
  });

  // 2. Role 스티커 랜덤 선택 (우상단 배치용)
  const roleCategory = stickerCategories.find(cat => cat.type === 'role');
  if (roleCategory && roleCategory.items.length > 0) {
    const randomRole = getRandomItem(roleCategory.items);
    avatar.role = {
      id: randomRole._id,
      name: randomRole.name,
      imageUrl: randomRole.imageUrl,
      thumbnailUrl: randomRole.thumbnailUrl || "",
      category: roleCategory.name
    };
    console.log(`[Backend] Role: ${randomRole.name}`);
  }

  // 3. 일반 스티커 랜덤 선택 (item1, item2, item3) - 항상 3개 모두 생성, 중복 없이
  const stickerCategory = stickerCategories.find(cat => cat.type === 'sticker');
  if (stickerCategory && stickerCategory.items.length > 0) {
    const availableStickers = [...stickerCategory.items];
    
    // 중복 없이 3개 스티커 선택
    const selectedStickers = getRandomItems(availableStickers, Math.min(3, availableStickers.length));
    
    // 만약 스티커가 3개 미만이면 부족한 만큼 중복 선택
    while (selectedStickers.length < 3 && availableStickers.length > 0) {
      selectedStickers.push(getRandomItem(availableStickers));
    }
    
    selectedStickers.slice(0, 3).forEach((sticker, index) => {
      const itemKey = `item${index + 1}` as 'item1' | 'item2' | 'item3';
      avatar[itemKey] = {
        id: sticker._id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        thumbnailUrl: sticker.thumbnailUrl || "",
        category: stickerCategory.name
      };
      console.log(`[Backend] ${itemKey}: ${sticker.name}`);
    });
  }

  console.log('[Backend] 랜덤 아바타 생성 완료', avatar);
  return avatar;
}

// 백엔드 데이터 통계 출력
export function logBackendDataStats(
  characterCategories: BackendCharacterCategory[], 
  stickerCategories: BackendStickerCategory[]
): void {
  console.log('\n=== 백엔드 데이터 통계 ===');
  
  // 캐릭터 카테고리 통계
  console.log(`\n📂 캐릭터 카테고리 (${characterCategories.length}개):`);
  characterCategories.forEach(category => {
    console.log(`  - ${category.name} (${category.type}): ${category.options.length}개 옵션`);
  });

  // 스티커 카테고리 통계  
  console.log(`\n🎨 스티커 카테고리 (${stickerCategories.length}개):`);
  stickerCategories.forEach(category => {
    console.log(`  - ${category.name} (${category.type}): ${category.items.length}개 아이템`);
    if (category.type === 'role') {
      console.log(`    → 우상단 배치용 Role 스티커`);
    } else if (category.type === 'sticker') {
      console.log(`    → 일반 스티커 (item1, item2, item3 용)`);
    }
  });
  
  console.log('========================\n');
}

// 유틸리티 함수들
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 백엔드 URL을 절대 URL로 변환
export function getFullImageUrl(relativeUrl: string): string {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
  return `${baseUrl}${relativeUrl}`;
}

// 이미지 URL 검증 및 fallback 처리
export function validateImageUrl(url: string, fallbackUrl?: string): string {
  if (!url && fallbackUrl) return fallbackUrl;
  return getFullImageUrl(url);
}