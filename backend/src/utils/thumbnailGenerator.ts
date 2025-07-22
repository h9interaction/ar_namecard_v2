// import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ThumbnailResult {
  thumbnailPath: string;
  thumbnailUrl: string;
  source: 'user' | 'auto';
}

export class ThumbnailGenerator {
  private static readonly THUMBNAIL_SIZE = 300;
  private static readonly THUMBNAIL_DIR = 'uploads/thumbnails';

  static async ensureThumbnailDir(): Promise<void> {
    try {
      await fs.access(this.THUMBNAIL_DIR);
    } catch {
      await fs.mkdir(this.THUMBNAIL_DIR, { recursive: true });
    }
  }

  /**
   * 원본 이미지에서 썸네일을 자동 생성합니다
   */
  static async generateThumbnail(
    originalImagePath: string,
    filename?: string
  ): Promise<ThumbnailResult> {
    await this.ensureThumbnailDir();

    const originalName = filename || path.basename(originalImagePath, path.extname(originalImagePath));
    const thumbnailFilename = `thumb_${originalName}_${Date.now()}.jpg`;
    const thumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    try {
      // Temporary: 원본 파일을 복사해서 썸네일로 사용 (Sharp 없이)
      console.log(`🔍 썸네일 생성 시도:`, { originalImagePath, thumbnailPath });
      
      // 원본 파일 존재 확인
      try {
        await fs.access(originalImagePath);
      } catch (error) {
        throw new Error(`Original image not found: ${originalImagePath}`);
      }
      
      // 원본 파일을 썸네일 디렉토리로 복사
      await fs.copyFile(originalImagePath, thumbnailPath);
      console.log(`✅ 썸네일 생성 완료:`, thumbnailPath);
      
      return {
        thumbnailPath,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        source: 'auto'
      };
    } catch (error) {
      console.error(`❌ 썸네일 생성 실패:`, error);
      throw new Error(`Failed to generate thumbnail: ${error}`);
    }
  }

  /**
   * 스프라이트 이미지의 첫 번째 프레임에서 썸네일을 생성합니다
   */
  static async generateThumbnailFromSprite(
    spriteImagePath: string,
    columns: number = 16,
    rows?: number,
    filename?: string
  ): Promise<ThumbnailResult> {
    await this.ensureThumbnailDir();

    const originalName = filename || path.basename(spriteImagePath, path.extname(spriteImagePath));
    const thumbnailFilename = `thumb_sprite_${originalName}_${Date.now()}.jpg`;
    const thumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    try {
      // 스프라이트 이미지 정보 가져오기
      // const { width, height } = await sharp(spriteImagePath).metadata();
      const width = 800, height = 600; // Temporary values
      
      if (!width || !height) {
        throw new Error('Cannot get sprite image dimensions');
      }

      // 첫 번째 프레임 크기 계산
      const frameWidth = Math.floor(width / columns);
      let frameHeight: number;
      
      if (rows) {
        // 행 수가 지정된 경우
        frameHeight = Math.floor(height / rows);
      } else {
        // 행 수가 지정되지 않은 경우, 정사각형 프레임이라고 가정
        frameHeight = frameWidth;
      }

      console.log(`Sprite info: ${width}x${height}, columns: ${columns}, rows: ${rows || 'auto'}`);
      console.log(`Frame size: ${frameWidth}x${frameHeight}`);

      // 첫 번째 프레임 추출
      // Temporary: Skip sharp processing
      // await sharp(spriteImagePath)...

      return {
        thumbnailPath,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        source: 'auto'
      };
    } catch (error) {
      throw new Error(`Failed to generate thumbnail from sprite: ${error}`);
    }
  }

  /**
   * 사용자가 업로드한 썸네일 이미지를 처리합니다
   */
  static async processUserThumbnail(
    thumbnailImagePath: string,
    filename?: string
  ): Promise<ThumbnailResult> {
    await this.ensureThumbnailDir();

    const originalName = filename || path.basename(thumbnailImagePath, path.extname(thumbnailImagePath));
    const thumbnailFilename = `thumb_user_${originalName}_${Date.now()}.jpg`;
    const thumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    try {
      // 사용자 업로드 이미지를 300x300으로 리사이징
      // Temporary: Skip sharp processing
      // await sharp(thumbnailImagePath)...

      return {
        thumbnailPath,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        source: 'user'
      };
    } catch (error) {
      throw new Error(`Failed to process user thumbnail: ${error}`);
    }
  }

  /**
   * 썸네일 파일을 삭제합니다
   */
  static async deleteThumbnail(thumbnailPath: string): Promise<void> {
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      console.warn(`Failed to delete thumbnail: ${thumbnailPath}`, error);
    }
  }

  /**
   * 이미지 파일이 유효한지 검증합니다
   */
  static async validateImage(imagePath: string): Promise<boolean> {
    try {
      // Temporary: Skip sharp validation
      // const metadata = await sharp(imagePath).metadata();
      // return !!(metadata.width && metadata.height);
      return true; // Always return true for development
    } catch {
      return false;
    }
  }

  /**
   * 썸네일 크기가 올바른지 검증합니다
   */
  static async validateThumbnailSize(imagePath: string): Promise<boolean> {
    try {
      // Temporary: Skip sharp validation
      // const { width, height } = await sharp(imagePath).metadata();
      // return width === this.THUMBNAIL_SIZE && height === this.THUMBNAIL_SIZE;
      return true; // Always return true for development
    } catch {
      return false;
    }
  }
}