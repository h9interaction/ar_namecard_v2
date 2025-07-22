import { CanvasTexture } from 'three';
import type { AvatarSelections } from '../types/avatar';
import { getFullImageUrl } from './avatarDataUtils';

/**
 * 백엔드 구조의 얼굴 요소들을 하나의 캔버스 텍스처로 합성하는 유틸리티
 */

export interface ComposedFaceTexture {
  texture: CanvasTexture;
  canvas: HTMLCanvasElement;
}

/**
 * 백엔드 AvatarSelections를 레이어 순서대로 합성하여 하나의 텍스처를 생성
 */
export async function composeBackendFaceTexture(
  avatarSelections: AvatarSelections,
  canvasSize: number = 512
): Promise<ComposedFaceTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    throw new Error('Canvas 2D context를 생성할 수 없습니다.');
  }

  // 투명 배경으로 초기화
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  
  // 고품질 렌더링 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 얼굴 요소 렌더링 순서 (뒤에서 앞으로) - 백엔드 타입 기준
  const renderOrder = [
    'hairback',  // 뒷머리
    'face',      // 얼굴형
    'hair',      // 머리
    'eyes',      // 눈
    'nose',      // 코  
    'mouth',     // 입
    'brow',      // 눈썹
    'glasses'    // 안경
  ];
  
  // 각 요소를 순서대로 그리기
  for (const elementType of renderOrder) {
    const element = avatarSelections[elementType];
    if (!element?.imageUrl) continue;

    try {
      // 백엔드 이미지 URL을 절대 URL로 변환
      const imageUrl = getFullImageUrl(element.imageUrl);
      const img = await loadImage(imageUrl);
      
      // 캔버스 중앙에 이미지 그리기
      const x = (canvasSize - img.width) / 2;
      const y = (canvasSize - img.height) / 2;
      
      ctx.drawImage(img, x, y);
      
      console.log(`[FaceComposer] ${elementType} 합성 완료: ${element.name}`);
      
    } catch (error) {
      console.warn(`⚠️ 얼굴 요소 로드 실패: ${elementType} - ${element.name}`, error);
    }
  }

  // 캔버스를 Three.js 텍스처로 변환
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  console.log('[FaceComposer] 얼굴 합성 완료');
  return { texture, canvas };
}

/**
 * 이미지를 비동기로 로드하는 헬퍼 함수
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * 백엔드 얼굴 요소가 변경되었을 때 텍스처를 업데이트하는 함수
 */
export async function updateBackendComposedFaceTexture(
  existingComposer: ComposedFaceTexture,
  avatarSelections: AvatarSelections
): Promise<void> {
  const ctx = existingComposer.canvas.getContext('2d');
  if (!ctx) return;

  // 캔버스 초기화
  ctx.clearRect(0, 0, existingComposer.canvas.width, existingComposer.canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 새로운 얼굴 요소들로 다시 합성
  const renderOrder = [
    'hairback', 'face', 'hair', 'eyes', 'nose', 'mouth', 'brow', 'glasses'
  ];

  for (const elementType of renderOrder) {
    const element = avatarSelections[elementType];
    if (!element?.imageUrl) continue;

    try {
      const imageUrl = getFullImageUrl(element.imageUrl);
      const img = await loadImage(imageUrl);
      const x = (existingComposer.canvas.width - img.width) / 2;
      const y = (existingComposer.canvas.height - img.height) / 2;
      ctx.drawImage(img, x, y);
    } catch (error) {
      console.warn(`⚠️ 얼굴 요소 업데이트 실패: ${elementType} - ${element.name}`, error);
    }
  }

  // 텍스처 업데이트
  existingComposer.texture.needsUpdate = true;
  console.log('[FaceComposer] 얼굴 합성 업데이트 완료');
}