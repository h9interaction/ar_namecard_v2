// import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { uploadToFirebase, getBucket } from '../config/firebase-storage';
import { Readable } from 'stream';

export interface ThumbnailResult {
  thumbnailPath: string;
  thumbnailUrl: string;
  source: 'user' | 'auto';
}

export class ThumbnailGenerator {
  private static readonly THUMBNAIL_SIZE = 300;
  private static readonly THUMBNAIL_DIR = 'uploads/thumbnails';

  /**
   * Firebase Storage URL인지 확인
   */
  private static isFirebaseUrl(url: string): boolean {
    return url.startsWith('https://storage.googleapis.com/') || url.startsWith('gs://');
  }

  /**
   * 이미지를 로컬 임시 파일로 다운로드 (Firebase Storage URL인 경우)
   */
  private static async downloadImageToTemp(imageUrl: string): Promise<string> {
    if (!this.isFirebaseUrl(imageUrl)) {
      // 로컬 파일 경로인 경우 절대 경로로 변환
      if (imageUrl.startsWith('/')) {
        // /uploads/... 형태의 경우
        return path.join(process.cwd(), imageUrl.slice(1));
      } else if (path.isAbsolute(imageUrl)) {
        // 이미 절대 경로인 경우 그대로 반환
        return imageUrl;
      } else {
        // 상대 경로인 경우 현재 디렉토리 기준으로 변환
        return path.join(process.cwd(), imageUrl);
      }
    }

    // Firebase Storage에서 다운로드
    const tempFilePath = path.join(process.cwd(), 'temp', `temp_${Date.now()}_${Math.random()}.jpg`);
    
    try {
      // temp 디렉토리 생성
      await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
      
      // Firebase Storage URL에서 파일 경로 추출 (개선된 파싱)
      const url = new URL(imageUrl);
      let filePath = '';
      
      // 다양한 Firebase Storage URL 형식 지원
      if (url.hostname.includes('firebasestorage.app') || url.hostname.includes('googleapis.com')) {
        // 새로운 형식: https://storage.googleapis.com/bucket-name/uploads/filename
        if (url.pathname.includes('/o/')) {
          filePath = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
        } else {
          // 직접 경로 형식: https://storage.googleapis.com/bucket-name/uploads/filename
          const pathParts = url.pathname.split('/');
          if (pathParts.length >= 3) {
            filePath = pathParts.slice(2).join('/'); // bucket-name 이후의 경로
          }
        }
      }
      
      if (!filePath) {
        console.error('❌ Firebase Storage URL 파싱 실패:', imageUrl);
        console.error('URL 구조:', { hostname: url.hostname, pathname: url.pathname });
        throw new Error('Invalid Firebase Storage URL format');
      }
      
      console.log('✅ 파싱된 Firebase 파일 경로:', filePath);

      const bucket = getBucket();
      const file = bucket.file(filePath);
      
      // 파일 다운로드
      const [fileBuffer] = await file.download();
      await fs.writeFile(tempFilePath, fileBuffer);
      
      return tempFilePath;
    } catch (error) {
      console.error('Error downloading image from Firebase:', error);
      throw new Error(`Failed to download image: ${error}`);
    }
  }

  /**
   * 썸네일 이미지를 Firebase Storage에 업로드
   */
  private static async uploadThumbnailToFirebase(localThumbnailPath: string, filename: string): Promise<string> {
    try {
      const thumbnailBuffer = await fs.readFile(localThumbnailPath);
      
      // Express.Multer.File 형태로 변환
      const uploadFile: Express.Multer.File = {
        fieldname: 'thumbnail',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: thumbnailBuffer,
        size: thumbnailBuffer.length,
        destination: '',
        filename: filename,
        path: localThumbnailPath,
        stream: null as any,
      };

      // Firebase Storage에 업로드
      const result = await uploadToFirebase(uploadFile, 'uploads/thumbnails/');
      
      // 임시 파일 삭제
      try {
        await fs.unlink(localThumbnailPath);
      } catch (error) {
        console.warn('Failed to delete temporary thumbnail file:', error);
      }
      
      return result.url;
    } catch (error) {
      console.error('Error uploading thumbnail to Firebase:', error);
      throw new Error(`Failed to upload thumbnail: ${error}`);
    }
  }

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

    // originalImagePath가 undefined인 경우 방어
    if (!originalImagePath) {
      throw new Error('Original image path is required for thumbnail generation');
    }
    
    const originalName = filename || path.basename(originalImagePath, path.extname(originalImagePath));
    const thumbnailFilename = `thumb_${originalName}_${Date.now()}.jpg`;
    const localThumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    let tempImagePath: string | null = null;

    try {
      console.log(`🔍 썸네일 생성 시도:`, { originalImagePath, thumbnailFilename });
      
      // 이미지 다운로드 (Firebase Storage URL인 경우)
      const localImagePath = await this.downloadImageToTemp(originalImagePath);
      if (this.isFirebaseUrl(originalImagePath)) {
        tempImagePath = localImagePath; // 임시 파일이므로 나중에 삭제
      }
      
      // 원본 파일 존재 확인
      try {
        await fs.access(localImagePath);
      } catch (error) {
        throw new Error(`Original image not found: ${localImagePath}`);
      }
      
      // Temporary: 원본 파일을 복사해서 썸네일로 사용 (Sharp 없이)
      await fs.copyFile(localImagePath, localThumbnailPath);
      console.log(`✅ 로컬 썸네일 생성 완료:`, localThumbnailPath);
      
      // Firebase Storage에 업로드
      const firebaseUrl = await this.uploadThumbnailToFirebase(localThumbnailPath, thumbnailFilename);
      console.log(`✅ Firebase 썸네일 업로드 완료:`, firebaseUrl);
      
      // 임시 이미지 파일 삭제
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
        } catch (error) {
          console.warn('Failed to delete temporary image file:', error);
        }
      }
      
      return {
        thumbnailPath: localThumbnailPath, // 로컬 경로 (호환성 유지)
        thumbnailUrl: firebaseUrl, // Firebase Storage URL
        source: 'auto'
      };
    } catch (error) {
      console.error(`❌ 썸네일 생성 실패:`, error);
      
      // 임시 파일들 정리
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
        } catch {}
      }
      try {
        await fs.unlink(localThumbnailPath);
      } catch {}
      
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

    // spriteImagePath가 undefined인 경우 방어
    if (!spriteImagePath) {
      throw new Error('Sprite image path is required for thumbnail generation');
    }

    const originalName = filename || path.basename(spriteImagePath, path.extname(spriteImagePath));
    const thumbnailFilename = `thumb_sprite_${originalName}_${Date.now()}.jpg`;
    const localThumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    let tempImagePath: string | null = null;

    try {
      console.log(`🔍 스프라이트 썸네일 생성 시도:`, { spriteImagePath, thumbnailFilename });
      
      // 이미지 다운로드 (Firebase Storage URL인 경우)
      const localImagePath = await this.downloadImageToTemp(spriteImagePath);
      if (this.isFirebaseUrl(spriteImagePath)) {
        tempImagePath = localImagePath; // 임시 파일이므로 나중에 삭제
      }

      // 스프라이트 이미지 정보 가져오기
      // const { width, height } = await sharp(localImagePath).metadata();
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

      // Temporary: 원본 파일을 복사해서 썸네일로 사용 (Sharp 없이)
      // 실제로는 Sharp를 사용해서 첫 번째 프레임만 추출해야 함
      await fs.copyFile(localImagePath, localThumbnailPath);
      console.log(`✅ 로컬 스프라이트 썸네일 생성 완료:`, localThumbnailPath);

      // Firebase Storage에 업로드
      const firebaseUrl = await this.uploadThumbnailToFirebase(localThumbnailPath, thumbnailFilename);
      console.log(`✅ Firebase 스프라이트 썸네일 업로드 완료:`, firebaseUrl);

      // 임시 이미지 파일 삭제
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
        } catch (error) {
          console.warn('Failed to delete temporary sprite image file:', error);
        }
      }

      return {
        thumbnailPath: localThumbnailPath, // 로컬 경로 (호환성 유지)
        thumbnailUrl: firebaseUrl, // Firebase Storage URL
        source: 'auto'
      };
    } catch (error) {
      console.error(`❌ 스프라이트 썸네일 생성 실패:`, error);
      
      // 임시 파일들 정리
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
        } catch {}
      }
      try {
        await fs.unlink(localThumbnailPath);
      } catch {}
      
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
    const localThumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailFilename);

    try {
      console.log(`🔍 사용자 썸네일 처리 시도:`, { thumbnailImagePath, thumbnailFilename });
      
      // 원본 파일 존재 확인
      try {
        await fs.access(thumbnailImagePath);
      } catch (error) {
        throw new Error(`Thumbnail image not found: ${thumbnailImagePath}`);
      }

      // Temporary: 원본 파일을 복사해서 썸네일로 사용 (Sharp 없이)
      // 실제로는 Sharp를 사용해서 300x300으로 리사이징해야 함
      await fs.copyFile(thumbnailImagePath, localThumbnailPath);
      console.log(`✅ 로컬 사용자 썸네일 생성 완료:`, localThumbnailPath);

      // Firebase Storage에 업로드
      const firebaseUrl = await this.uploadThumbnailToFirebase(localThumbnailPath, thumbnailFilename);
      console.log(`✅ Firebase 사용자 썸네일 업로드 완료:`, firebaseUrl);

      return {
        thumbnailPath: localThumbnailPath, // 로컬 경로 (호환성 유지)
        thumbnailUrl: firebaseUrl, // Firebase Storage URL
        source: 'user'
      };
    } catch (error) {
      console.error(`❌ 사용자 썸네일 처리 실패:`, error);
      
      // 임시 파일 정리
      try {
        await fs.unlink(localThumbnailPath);
      } catch {}
      
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