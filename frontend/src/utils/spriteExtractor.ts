/**
 * 스프라이트시트에서 개별 프레임을 추출하는 유틸리티
 */

export interface ExtractedFrame {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

export interface SpriteSheetInfo {
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  framesPerRow: number;
  totalRows: number;
}

/**
 * 스프라이트시트 이미지를 분석하여 프레임 정보를 추출
 */
export async function analyzeSpriteSheet(imagePath: string): Promise<SpriteSheetInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const framesPerRow = 16; // 가로 16개 고정
      const frameWidth = img.width / framesPerRow;
      const frameHeight = frameWidth; // 정사각형 프레임 가정
      const totalRows = Math.ceil(img.height / frameHeight);
      
      // 마지막 행의 실제 프레임 수를 계산하기 위해 투명도 검사
      let totalFrames = 0;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      
      // 각 프레임 위치를 확인하여 실제 프레임 수 계산
      for (let row = 0; row < totalRows; row++) {
        let emptyFramesInRow = 0;
        for (let col = 0; col < framesPerRow; col++) {
          ctx.clearRect(0, 0, frameWidth, frameHeight);
          ctx.drawImage(
            img,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            0, 0, frameWidth, frameHeight
          );
          
          // 프레임이 비어있는지 확인 (알파 채널 검사)
          const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
          let hasContent = false;
          
          // 더 정확한 검사 - 전체 픽셀의 알파값 확인
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 10) { // 알파 값이 10보다 크면 내용 있음 (노이즈 제거)
              hasContent = true;
              break;
            }
          }
          
          if (hasContent) {
            totalFrames++;
            emptyFramesInRow = 0; // 연속 빈 프레임 카운터 리셋
          } else {
            emptyFramesInRow++;
            // 연속으로 3개 이상 빈 프레임이면 해당 행에서 중단
            if (emptyFramesInRow >= 3) {
              break;
            }
          }
        }
        
        // 전체 행이 비어있으면 중단
        if (emptyFramesInRow >= framesPerRow) {
          break;
        }
      }
      
      
      resolve({
        frameWidth,
        frameHeight,
        totalFrames,
        framesPerRow,
        totalRows
      });
    };
    
    img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${imagePath}`));
    img.src = imagePath;
  });
}

/**
 * 스프라이트시트에서 특정 프레임을 추출
 */
export function extractFrame(
  img: HTMLImageElement,
  frameIndex: number,
  spriteInfo: SpriteSheetInfo
): ExtractedFrame {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  canvas.width = spriteInfo.frameWidth;
  canvas.height = spriteInfo.frameHeight;
  
  // 프레임 인덱스를 row, col로 변환
  const row = Math.floor(frameIndex / spriteInfo.framesPerRow);
  const col = frameIndex % spriteInfo.framesPerRow;
  
  // 해당 프레임 추출
  ctx.drawImage(
    img,
    col * spriteInfo.frameWidth, 
    row * spriteInfo.frameHeight, 
    spriteInfo.frameWidth, 
    spriteInfo.frameHeight,
    0, 0, 
    spriteInfo.frameWidth, 
    spriteInfo.frameHeight
  );
  
  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png')
  };
}

/**
 * 스프라이트시트의 모든 프레임을 추출
 */
export async function extractAllFrames(imagePath: string): Promise<ExtractedFrame[]> {
  const spriteInfo = await analyzeSpriteSheet(imagePath);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const frames: ExtractedFrame[] = [];
      
      for (let i = 0; i < spriteInfo.totalFrames; i++) {
        try {
          const frame = extractFrame(img, i, spriteInfo);
          frames.push(frame);
        } catch (error) {
          console.warn(`Failed to extract frame ${i}:`, error);
        }
      }
      
      resolve(frames);
    };
    
    img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${imagePath}`));
    img.src = imagePath;
  });
}