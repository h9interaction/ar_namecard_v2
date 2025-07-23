// import sharp from 'sharp'; // Temporarily commented out due to platform issues
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class PaletteImageProcessor {
  private static PALETTE_SIZE = 128;
  private static PALETTE_UPLOAD_DIR = 'uploads/palettes';

  static async ensurePaletteDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.PALETTE_UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.PALETTE_UPLOAD_DIR, { recursive: true });
    }
  }

  static async processPaletteImage(inputPath: string, originalFilename?: string): Promise<{ paletteImageUrl: string, filename: string }> {
    // inputPath가 undefined인 경우 처리
    if (!inputPath) {
      throw new Error('Input path is required for palette image processing');
    }

    await this.ensurePaletteDirectoryExists();

    const fileExtension = path.extname(originalFilename || inputPath) || '.jpg';
    const filename = `palette_${uuidv4()}${fileExtension}`;
    const outputPath = path.join(this.PALETTE_UPLOAD_DIR, filename);

    try {
      // TEMPORARY WORKAROUND: Just copy the file for now until Sharp is fixed
      await fs.copyFile(inputPath, outputPath);
      
      console.log('⚠️  NOTICE: Using temporary palette image processing (Sharp not available)');

      // 원본 파일 삭제 (임시 업로드 파일인 경우)
      if (inputPath.includes('uploads/') && !inputPath.includes('palettes/')) {
        try {
          await fs.unlink(inputPath);
        } catch (error) {
          console.warn('Failed to delete temporary file:', inputPath);
        }
      }

      return {
        paletteImageUrl: `/${this.PALETTE_UPLOAD_DIR}/${filename}`,
        filename
      };
    } catch (error) {
      console.error('Error processing palette image:', error);
      throw new Error('Failed to process palette image');
    }
  }

  static async deletePaletteImage(paletteImageUrl: string): Promise<void> {
    if (!paletteImageUrl) return;

    try {
      const filename = path.basename(paletteImageUrl);
      const filePath = path.join(this.PALETTE_UPLOAD_DIR, filename);
      
      // 파일 존재 여부 확인
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`Palette image deleted: ${filePath}`);
      } catch (accessError: any) {
        if (accessError.code === 'ENOENT') {
          console.log(`Palette image already deleted or not found: ${filePath}`);
        } else {
          throw accessError;
        }
      }
    } catch (error) {
      console.warn(`Failed to delete palette image: ${paletteImageUrl}`, error);
    }
  }

  static getFilePathFromUrl(url: string): string {
    if (!url) return '';
    const filename = path.basename(url);
    return path.join(this.PALETTE_UPLOAD_DIR, filename);
  }
}