import { CanvasTexture, TextureLoader } from 'three';
import type { FaceElements } from '../types/avatar';

/**
 * 얼굴 요소들을 하나의 캔버스 텍스처로 합성하는 유틸리티
 */

export interface ComposedFaceTexture {
  texture: CanvasTexture;
  canvas: HTMLCanvasElement;
}

/**
 * 얼굴 요소들을 레이어 순서대로 합성하여 하나의 텍스처를 생성
 */
export async function composeFaceTexture(
  faceElements: FaceElements,
  canvasSize: number = 512
): Promise<ComposedFaceTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas 2D context를 생성할 수 없습니다.');
  }

  // 투명 배경으로 초기화
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  
  // 고품질 렌더링 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 얼굴 요소 렌더링 순서 (뒤에서 앞으로)
  const renderOrder: Array<keyof FaceElements> = [
    'hairback',
    'shape', 
    'hair',
    'eyes',
    'nose',
    'mouth',
    'brows',
    'bang',
    'glasses'
  ];

  const loader = new TextureLoader();
  
  // 각 요소를 순서대로 그리기
  for (const elementType of renderOrder) {
    const imagePath = faceElements[elementType];
    if (!imagePath) continue;

    try {
      // 이미지 로드 및 그리기
      const img = await loadImage(`/src/assets/test_images/face/${elementType}/${imagePath}`);
      
      // 캔버스 중앙에 이미지 그리기
      const x = (canvasSize - img.width) / 2;
      const y = (canvasSize - img.height) / 2;
      
      ctx.drawImage(img, x, y);
      
    } catch (error) {
      console.warn(`⚠️ 얼굴 요소 로드 실패: ${elementType} - ${imagePath}`, error);
    }
  }

  // 캔버스를 Three.js 텍스처로 변환
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

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
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 얼굴 요소가 변경되었을 때 텍스처를 업데이트하는 함수
 */
export async function updateComposedFaceTexture(
  existingComposer: ComposedFaceTexture,
  faceElements: FaceElements
): Promise<void> {
  const ctx = existingComposer.canvas.getContext('2d');
  if (!ctx) return;

  // 캔버스 초기화
  ctx.clearRect(0, 0, existingComposer.canvas.width, existingComposer.canvas.height);

  // 새로운 얼굴 요소들로 다시 합성
  const renderOrder: Array<keyof FaceElements> = [
    'hairback', 'shape', 'hair', 'eyes', 'nose', 'mouth', 'brows', 'bang', 'glasses'
  ];

  for (const elementType of renderOrder) {
    const imagePath = faceElements[elementType];
    if (!imagePath) continue;

    try {
      const img = await loadImage(`/src/assets/test_images/face/${elementType}/${imagePath}`);
      const x = (existingComposer.canvas.width - img.width) / 2;
      const y = (existingComposer.canvas.height - img.height) / 2;
      ctx.drawImage(img, x, y);
    } catch (error) {
      console.warn(`⚠️ 얼굴 요소 업데이트 실패: ${elementType} - ${imagePath}`, error);
    }
  }

  // 텍스처 업데이트
  existingComposer.texture.needsUpdate = true;
}