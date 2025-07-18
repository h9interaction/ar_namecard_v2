import type { AvatarData, AvatarPreset, AssetCategory } from '../types/avatar';

// 샘플 아바타 데이터
export const sampleAvatar: AvatarData = {
  id: 'avatar_001',
  name: '내 아바타',
  face: {
    bang: 'bang_01.png',
    brows: 'brows_01.png',
    eyes: 'eyes_01.png',
    glasses: null,
    hair: 'hair_01.png',
    hairback: 'hairback_01.png',
    mouth: 'mouth_01.png',
    nose: 'nose_01.png',
    shape: 'shape_01.png'
  },
  sprites: [
    {
      id: 'sprite_001',
      image: 'sprite_snorkel.png',
      position: { x: -0.6, y: 0.8, z: 0.12 }
    },
    {
      id: 'sprite_002',
      image: 'sprite_director.png',
      position: { x: 0.6, y: 0.8, z: 0.18 }
    },
    {
      id: 'sprite_003',
      image: 'sprite_frog.png',
      position: { x: -0.6, y: -0.4, z: 0.13 }
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// 아바타 프리셋 샘플
export const avatarPresets: AvatarPreset[] = [
  {
    id: 'preset_001',
    name: 'Director 스타일',
    thumbnail: 'preset_director.png',
    data: {
      name: 'Director 아바타',
      face: {
        bang: 'bang_02.png',
        brows: 'brows_02.png',
        eyes: 'eyes_02.png',
        glasses: 'glasses_01.png',
        hair: 'hair_02.png',
        hairback: 'hairback_02.png',
        mouth: 'mouth_02.png',
        nose: 'nose_01.png',
        shape: 'shape_01.png'
      },
      sprites: [
        {
          id: 'sprite_director',
          image: 'sprite_director.png',
          position: { x: 0.6, y: 0.8, z: 0.18 }
        },
        {
          id: 'sprite_glasses',
          image: 'sprite_sunglasses.png',
          position: { x: -0.6, y: 0.8, z: 0.12 }
        },
        {
          id: 'sprite_coffee',
          image: 'sprite_coffee.png',
          position: { x: 0.6, y: -0.4, z: 0.16 }
        }
      ]
    }
  }
];

// 에셋 카테고리 샘플
export const assetCategories: AssetCategory[] = [
  {
    id: 'face_elements',
    name: '얼굴 요소',
    type: 'face',
    items: [
      { id: 'bang_01', name: '앞머리 1', image: 'bang_01.png', category: 'bang' },
      { id: 'bang_02', name: '앞머리 2', image: 'bang_02.png', category: 'bang' },
      { id: 'eyes_01', name: '눈 1', image: 'eyes_01.png', category: 'eyes' },
      { id: 'eyes_02', name: '눈 2', image: 'eyes_02.png', category: 'eyes' },
      { id: 'mouth_01', name: '입 1', image: 'mouth_01.png', category: 'mouth' },
      { id: 'mouth_02', name: '입 2', image: 'mouth_02.png', category: 'mouth' }
    ]
  },
  {
    id: 'sprites',
    name: '스티커',
    type: 'sprite',
    items: [
      { id: 'sprite_snorkel', name: '스노클링', image: 'sprite_snorkel.png', category: 'activity', tags: ['여름', '바다'] },
      { id: 'sprite_director', name: '감독', image: 'sprite_director.png', category: 'job', tags: ['영화', '직업'] },
      { id: 'sprite_frog', name: '개구리', image: 'sprite_frog.png', category: 'animal', tags: ['동물', '귀여움'] },
      { id: 'sprite_coffee', name: '커피', image: 'sprite_coffee.png', category: 'drink', tags: ['음료', '카페'] }
    ]
  }
];

// 기본 아바타 템플릿
export const defaultAvatarTemplate: AvatarData = {
  id: '',
  name: '새 아바타',
  face: {
    bang: null,
    brows: null,
    eyes: null,
    glasses: null,
    hair: null,
    hairback: null,
    mouth: null,
    nose: null,
    shape: null
  },
  sprites: [],
  createdAt: new Date(),
  updatedAt: new Date()
};