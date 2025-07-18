import type { AvatarData, SpriteElement } from '../types/avatar';

// 실제 파일 목록을 기반으로 한 에셋 데이터
const FACE_ASSETS = {
  bang: ['3.png'],
  brows: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png'],
  eyes: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png', '18.png'],
  glasses: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
  hair: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png', '18.png', '19.png', '20.png', '21.png', '22.png', '23.png', '24.png', '25.png', '26.png', '27.png', '28.png', '29.png', '30.png', '31.png', '32.png'],
  hairback: ['22_2.png', '23_2.png', '24_2.png', '25_2.png', '26_2.png', '27_2.png', '28_2.png', '29_2.png', '30_2.png', '31_2.png', '32_2.png', '33_2_2.png', '35_2.png'],
  mouth: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png', '18.png', '19.png', '20.png', '21.png', '22.png', '23.png', '24.png'],
  nose: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
  shape: ['1_1.png', '1_2.png', '1_3.png', '2_1.png', '2_2.png', '2_3.png', '3_1.png', '3_2.png', '3_3.png', '4_1.png', '4_2.png', '4_3.png', '5_1.png', '5_2.png', '5_3.png', '6_1.png', '6_2.png', '6_3.png', '7_1.png', '7_2.png', '7_3.png']
};

const SPRITE_ASSETS = [
  'backpack.png', 'baseball.png', 'beer.png', 'book.png', 'camera.png', 'camera_1.png',
  'cat_1.png', 'cat_3.png', 'cocktail.png', 'coffee.png', 'coke.png', 'cycle.png',
  'dog_1.png', 'dumbel.png', 'fish_shaped_bun.png', 'flower_pot.png', 'frog.png',
  'golf.png', 'grass.png', 'guitar.png', 'guitar_blue.png', 'ice_coffee.png',
  'mask_blue.png', 'mask_yellow.png', 'mountain.png', 'pen_tool.png', 'soju.png',
  'square.png', 'suit_case_blue.png', 'wine.png'
];

// 랜덤 선택 함수
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 position 생성
function getRandomPosition(index: number): { x: number; y: number; z: number } {
  const positions = [
    { x: -0.6, y: 0.8, z: 0.12 },   // 왼쪽 위
    { x: 0.6, y: 0.8, z: 0.18 },    // 오른쪽 위
    { x: -0.6, y: -0.4, z: 0.13 },  // 왼쪽 아래
    { x: 0.6, y: -0.4, z: 0.16 }    // 오른쪽 아래
  ];
  return positions[index] || positions[0];
}

// 랜덤 아바타 생성
export function generateRandomAvatar(): AvatarData {
  // 면부 요소 랜덤 선택 (일부는 null일 수 있음)
  const face = {
    bang: Math.random() > 0.3 ? getRandomItem(FACE_ASSETS.bang) : null,
    brows: getRandomItem(FACE_ASSETS.brows),
    eyes: getRandomItem(FACE_ASSETS.eyes),
    glasses: Math.random() > 0.7 ? getRandomItem(FACE_ASSETS.glasses) : null,
    hair: getRandomItem(FACE_ASSETS.hair),
    hairback: Math.random() > 0.5 ? getRandomItem(FACE_ASSETS.hairback) : null,
    mouth: getRandomItem(FACE_ASSETS.mouth),
    nose: getRandomItem(FACE_ASSETS.nose),
    shape: getRandomItem(FACE_ASSETS.shape)
  };

  // 랜덤 스프라이트 4개 선택
  const selectedSprites = [...SPRITE_ASSETS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const sprites: SpriteElement[] = selectedSprites.map((sprite, index) => ({
    id: `sprite_${index + 1}`,
    image: sprite,
    position: getRandomPosition(index)
  }));

  return {
    id: `avatar_${Date.now()}`,
    name: '랜덤 아바타',
    face,
    sprites,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// 디버깅용 아바타 정보 포맷팅
export function formatAvatarDebugInfo(avatar: AvatarData): string {
  const faceElements = Object.entries(avatar.face)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const spriteElements = avatar.sprites
    .map((sprite, index) => `sprite${index + 1}: ${sprite.image} (${sprite.position.x}, ${sprite.position.y}, ${sprite.position.z})`)
    .join('\n');

  return `=== 아바타 디버그 정보 ===
ID: ${avatar.id}
이름: ${avatar.name}

[얼굴 요소]
${faceElements}

[스프라이트 (${avatar.sprites.length}개)]
${spriteElements}

생성일: ${avatar.createdAt.toLocaleString()}`;
}