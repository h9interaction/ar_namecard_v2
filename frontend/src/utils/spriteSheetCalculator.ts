/**
 * 스프라이트 시트의 프레임 수를 계산하는 유틸리티
 */

export interface SpriteSheetInfo {
  totalFrames: number;
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
}

/**
 * 스프라이트 시트 정보를 계산합니다
 * @param imageWidth 이미지 전체 너비 (4096)
 * @param imageHeight 이미지 전체 높이
 * @param colsPerRow 한 줄당 프레임 수 (16)
 */
export function calculateSpriteSheetInfo(
  imageWidth: number, 
  imageHeight: number, 
  colsPerRow: number = 16
): SpriteSheetInfo {
  const frameSize = imageWidth / colsPerRow; // 256px (정사각형)
  const totalRows = Math.ceil(imageHeight / frameSize);
  
  // 완전한 행의 수
  const completeRows = Math.floor(imageHeight / frameSize);
  
  // 마지막 행이 완전한지 확인
  const hasIncompleteLastRow = (imageHeight % frameSize) !== 0;
  
  let totalFrames: number;
  
  if (hasIncompleteLastRow) {
    // 마지막 행이 불완전한 경우
    // 마지막 행의 실제 높이를 기반으로 추정
    const lastRowHeight = imageHeight % frameSize;
    const estimatedLastRowFrames = Math.ceil(lastRowHeight / frameSize * colsPerRow);
    totalFrames = completeRows * colsPerRow + Math.min(estimatedLastRowFrames, colsPerRow);
  } else {
    // 모든 행이 완전한 경우
    totalFrames = totalRows * colsPerRow;
  }
  
  return {
    totalFrames,
    cols: colsPerRow,
    rows: totalRows,
    frameWidth: 1 / colsPerRow, // UV 좌표용 (0-1 범위)
    frameHeight: 1 / totalRows  // UV 좌표용 (0-1 범위)
  };
}

/**
 * 프레임 인덱스를 UV 좌표로 변환합니다
 */
export function getFrameUVOffset(frameIndex: number, spriteInfo: SpriteSheetInfo): { x: number; y: number } {
  const col = frameIndex % spriteInfo.cols;
  const row = Math.floor(frameIndex / spriteInfo.cols);
  
  return {
    x: col / spriteInfo.cols,
    y: 1 - (row + 1) / spriteInfo.rows // Y축 뒤집기 (OpenGL 스타일)
  };
}

/**
 * 스프라이트별 메타데이터 (실제 프레임 수가 알려진 경우)
 * 나중에 각 스프라이트의 정확한 프레임 수를 여기에 정의할 수 있습니다
 */
export const SPRITE_METADATA: Record<string, { frames?: number; fps?: number }> = {
  'backpack.png': { frames: 24, fps: 12 },
  'baseball.png': { frames: 16, fps: 12 },
  'beer.png': { frames: 32, fps: 12 },
  'book.png': { frames: 20, fps: 12 },
  'camera.png': { frames: 28, fps: 12 },
  // 추가 스프라이트들의 정확한 프레임 수는 나중에 추가
  // 기본값은 계산된 값을 사용
};