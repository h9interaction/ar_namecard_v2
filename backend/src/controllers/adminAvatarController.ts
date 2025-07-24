import { Request, Response } from 'express';
import { AvatarCategory } from '../models';
import { validationResult } from 'express-validator';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import { PaletteImageProcessor } from '../utils/paletteImageProcessor';
import { uploadToFirebase } from '../config/firebase-storage';
import { uploadToFirebaseStorage } from '../middleware/upload';
import path from 'path';
import fs from 'fs/promises'; // Added fs import

interface AuthRequest extends Request {
  user?: any;
}

// 파일 삭제 유틸리티 함수
const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    // 파일이 존재하지 않거나 삭제 실패해도 무시
    console.warn(`Failed to delete file: ${filePath}`, error);
  }
};

// URL에서 실제 파일 경로 추출
const getFilePathFromUrl = (url: string): string => {
  if (!url) return '';
  const filename = path.basename(url);
  return path.join(process.cwd(), 'uploads', filename);
};

// 썸네일 URL에서 실제 파일 경로 추출
const getThumbnailPathFromUrl = (url: string): string => {
  if (!url) return '';
  const filename = path.basename(url);
  return path.join(process.cwd(), 'uploads', 'thumbnails', filename);
};

export const getAllAvatarCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { type } = req.query;
    const query = type ? { type } : {};

    const categories = await AvatarCategory.find(query).sort({ order: 1 });
    
    // 기존 데이터 호환성을 위한 마이그레이션 로직 적용
    const migratedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      if (categoryObj.options) {
        categoryObj.options = categoryObj.options.map((option: any) => {
          // 기존 구조(단일 color string)를 새 구조로 변환
          if (typeof option.color === 'string' && option.imageUrl) {
            option.color = [{
              colorName: option.color === '#000000' ? 'Black' : option.color === '#ffffff' ? 'White' : option.color,
              imageUrl: option.imageUrl
            }];
          }
          // color가 배열이 아니고 imageUrl이 있는 경우 (null, undefined 등)
          else if (!Array.isArray(option.color) && option.imageUrl) {
            option.color = [{
              colorName: 'Default',
              imageUrl: option.imageUrl
            }];
          }

          // 기존 hairParts를 resourceImages로 변환 (hair 카테고리만)
          if (categoryObj.type === 'hair' && option.hairParts && Array.isArray(option.color)) {
            option.color = option.color.map((colorOpt: any) => {
              if (!colorOpt.resourceImages) {
                // 새로운 객체 구조로 변환
                const resourceImages: any = {};
                if (option.hairParts.middle) {
                  resourceImages.hairMiddleImageUrl = option.hairParts.middle; // 중간머리
                }
                if (option.hairParts.back) {
                  resourceImages.hairBackImageUrl = option.hairParts.back; // 뒷머리
                }
                colorOpt.resourceImages = resourceImages;
              }
              return colorOpt;
            });
            // 변환 후 hairParts 제거
            delete option.hairParts;
          }
          
          // 기존 배열 구조 resourceImages를 객체 구조로 변환 (hair 카테고리만)
          if (categoryObj.type === 'hair' && Array.isArray(option.color)) {
            option.color = option.color.map((colorOpt: any) => {
              if (colorOpt.resourceImages && Array.isArray(colorOpt.resourceImages)) {
                // 배열 구조를 객체 구조로 변환
                const newResourceImages: any = {};
                if (colorOpt.resourceImages[2]) {
                  newResourceImages.hairMiddleImageUrl = colorOpt.resourceImages[2]; // 중간머리
                }
                if (colorOpt.resourceImages[0]) {
                  newResourceImages.hairBackImageUrl = colorOpt.resourceImages[0]; // 뒷머리
                }
                colorOpt.resourceImages = newResourceImages;
              }
              return colorOpt;
            });
          }
          
          return option;
        });
      }
      return categoryObj;
    });
    
    res.json({ categories: migratedCategories, total: migratedCategories.length });
  } catch (error) {
    console.error('Error fetching avatar categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAvatarCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const category = await AvatarCategory.findById(id);

    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    // 기존 데이터 호환성을 위한 마이그레이션 로직 적용
    const categoryObj = category.toObject();
    if (categoryObj.options) {
      categoryObj.options = categoryObj.options.map((option: any) => {
        // 기존 구조(단일 color string)를 새 구조로 변환
        if (typeof option.color === 'string' && option.imageUrl) {
          option.color = [{
            colorName: option.color === '#000000' ? 'Black' : option.color === '#ffffff' ? 'White' : option.color,
            imageUrl: option.imageUrl
          }];
        }
        // color가 배열이 아니고 imageUrl이 있는 경우 (null, undefined 등)
        else if (!Array.isArray(option.color) && option.imageUrl) {
          option.color = [{
            colorName: 'Default',
            imageUrl: option.imageUrl
          }];
        }
        
        return option;
      });
    }

    res.json(categoryObj);
  } catch (error) {
    console.error('Error fetching avatar category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAvatarCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
      return;
    }

    const { name, type, order = 0 } = req.body;

    // 동일한 type이 있는지 확인
    const existingCategory = await AvatarCategory.findOne({ type });
    if (existingCategory) {
      res.status(400).json({ message: 'Avatar category with this type already exists' });
      return;
    }

    const category = new AvatarCategory({
      name,
      type,
      options: [],
      order
    });

    await category.save();
    res.status(201).json({ message: 'Avatar category created successfully', category });
  } catch (error) {
    console.error('Error creating avatar category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAvatarCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, type, order } = req.body;

    // type이 변경되는 경우 중복 확인
    if (type) {
      const existingCategory = await AvatarCategory.findOne({ type, _id: { $ne: id } });
      if (existingCategory) {
        res.status(400).json({ message: 'Avatar category with this type already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (order !== undefined) updateData.order = order;

    const category = await AvatarCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    res.json({ message: 'Avatar category updated successfully', category });
  } catch (error) {
    console.error('Error updating avatar category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAvatarCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const category = await AvatarCategory.findById(id);

    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    // 카테고리의 모든 옵션 이미지, 썸네일 및 팔레트 이미지 삭제
    for (const option of category.options) {
      if (option.imageUrl) {
        const imagePath = getFilePathFromUrl(option.imageUrl);
        await deleteFileIfExists(imagePath);
      }
      if (option.thumbnailUrl) {
        const thumbnailPath = getThumbnailPathFromUrl(option.thumbnailUrl);
        await deleteFileIfExists(thumbnailPath);
      }
      
      // 팔레트 이미지들 삭제
      if (option.color && Array.isArray(option.color)) {
        for (const colorOpt of option.color) {
          if (colorOpt.paletteImageUrl) {
            await PaletteImageProcessor.deletePaletteImage(colorOpt.paletteImageUrl);
          }
        }
      }
    }

    await AvatarCategory.findByIdAndDelete(id);
    res.json({ message: 'Avatar category deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addAvatarOption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, colorOptions, order = 0 } = req.body;
    const files = req.files as Express.Multer.File[];
    
    console.log(`🔍 addAvatarOption 요청 데이터:`, {
      name,
      colorOptionsType: typeof colorOptions,
      colorOptionsLength: colorOptions?.length,
      filesCount: files?.length || 0
    });
    
    // colorOptions는 JSON 문자열로 전송될 것임
    let parsedColorOptions;
    try {
      parsedColorOptions = typeof colorOptions === 'string' ? JSON.parse(colorOptions) : colorOptions;
      console.log(`🔍 파싱된 colorOptions:`, parsedColorOptions);
    } catch (error) {
      console.error('❌ colorOptions 파싱 실패:', error);
      res.status(400).json({ message: 'Invalid colorOptions format' });
      return;
    }

    if (!parsedColorOptions || !Array.isArray(parsedColorOptions) || parsedColorOptions.length === 0) {
      console.error('❌ colorOptions 검증 실패:', {
        exists: !!parsedColorOptions,
        isArray: Array.isArray(parsedColorOptions),
        length: parsedColorOptions?.length || 0
      });
      res.status(400).json({ message: 'At least one color option is required' });
      return;
    }

    const category = await AvatarCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    // hair 카테고리 감지
    const isHairCategory = category.type === 'hair';

    // 파일 배열을 객체로 변환 (upload.any() 사용으로 인해)
    const filesByName: { [key: string]: Express.Multer.File[] } = {};
    if (Array.isArray(files)) {
      files.forEach(file => {
        if (!filesByName[file.fieldname]) {
          filesByName[file.fieldname] = [];
        }
        filesByName[file.fieldname].push(file);
      });
    }

    // 디버깅: 받은 파일들 완전 분석
    console.log('🔍 받은 모든 파일들 원본 배열:', files?.map((f, i) => ({
      index: i,
      fieldname: f.fieldname,
      originalname: f.originalname,
      size: f.size,
      hasBuffer: !!f.buffer
    })));
    
    console.log('🔍 fieldname별 그룹핑 결과:', Object.keys(filesByName).map(key => ({
      fieldname: key,
      fileCount: filesByName[key].length,
      files: filesByName[key].map((f, i) => ({
        index: i,
        originalname: f.originalname,
        size: f.size
      }))
    })));
    
    if (isHairCategory) {
      console.log('💇‍♀️ Hair 카테고리 파일들:', Object.keys(filesByName).filter(key => key.startsWith('hair_')));
    }

    // 팔레트 파일 매칭 로직 개선 - 여러 방식 지원
    const paletteFiles: Express.Multer.File[] = [];
    
    // 방법 1: palette_0, palette_1, palette_2 형태로 전송된 경우
    for (let i = 0; i < parsedColorOptions.length; i++) {
      const paletteKey = `palette_${i}`;
      if (filesByName[paletteKey] && filesByName[paletteKey].length > 0) {
        paletteFiles[i] = filesByName[paletteKey][0];
      }
    }
    
    // 방법 2: palette 필드로 여러 파일이 온 경우 (기존 방식)
    if (paletteFiles.filter(f => f).length === 0 && filesByName.palette) {
      filesByName.palette.forEach((file, index) => {
        if (index < parsedColorOptions.length) {
          paletteFiles[index] = file;
        }
      });
    }
    
    // 방법 3: palette[0], palette[1], palette[2] 형태로 전송된 경우
    if (paletteFiles.filter(f => f).length === 0) {
      for (let i = 0; i < parsedColorOptions.length; i++) {
        const paletteKey = `palette[${i}]`;
        if (filesByName[paletteKey] && filesByName[paletteKey].length > 0) {
          paletteFiles[i] = filesByName[paletteKey][0];
        }
      }
    }
    
    console.log(`🔍 개선된 팔레트 파일 매칭 결과:`, {
      colorOptionsLength: parsedColorOptions.length,
      paletteFilesLength: paletteFiles.length,
      matchedFiles: paletteFiles.map((f, i) => ({
        index: i,
        hasFile: !!f,
        fileName: f?.originalname || '없음',
        fileSize: f?.size || 0
      })),
      totalMatchedFiles: paletteFiles.filter(f => f).length
    });
    
    // 컬러 옵션과 팔레트 파일 수 불일치 경고
    const matchedFileCount = paletteFiles.filter(f => f).length;
    if (matchedFileCount > 0 && matchedFileCount !== parsedColorOptions.length) {
      console.warn(`⚠️ 팔레트 파일 수(${matchedFileCount})와 컬러 옵션 수(${parsedColorOptions.length})가 일치하지 않습니다!`);
    }
    
    const processedColorOptions = await Promise.all(
      parsedColorOptions.map(async (colorOption: any, index: number) => {
        let paletteImageUrl = '';
        let resourceImages: { hairMiddleImageUrl: string; hairBackImageUrl?: string } | undefined;
        
        const paletteFile = paletteFiles[index];
        console.log(`🔍 처리 중 - 컬러 옵션 ${index}:`, {
          colorName: colorOption.colorName,
          hasPaletteFile: !!paletteFile,
          paletteFileName: paletteFile?.originalname,
          paletteFileSize: paletteFile?.size,
          paletteHasBuffer: !!paletteFile?.buffer,
          availablePaletteFiles: paletteFiles.length,
          maxIndex: paletteFiles.length - 1
        });
        
        // 해당 인덱스에 팔레트 이미지가 있으면 처리
        if (paletteFile && paletteFile.buffer) {
          try {
            console.log(`🔄 팔레트 이미지 업로드 시작 (색상 옵션 ${index}): ${paletteFile.originalname}`);
            // Firebase Storage에 팔레트 이미지 업로드
            const uploadResult = await uploadToFirebaseStorage(paletteFile, 'palettes/');
            paletteImageUrl = uploadResult.url;
            console.log(`✅ 팔레트 이미지 업로드 완료 (색상 옵션 ${index}):`, {
              originalName: paletteFile.originalname,
              uploadedUrl: uploadResult.url
            });
          } catch (error) {
            console.error(`❌ 팔레트 이미지 업로드 실패 (색상 옵션 ${index}):`, {
              fileName: paletteFile.originalname,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else if (paletteFile && !paletteFile.buffer) {
          console.error(`❌ 팔레트 파일 버퍼 없음 (색상 옵션 ${index}):`, paletteFile.originalname);
        } else {
          console.log(`ℹ️ 팔레트 파일 없음 (색상 옵션 ${index}): ${colorOption.colorName}`);
        }

        // hair 카테고리인 경우 리소스 이미지 처리
        if (isHairCategory) {
          // hair 검증: 중간머리는 필수
          const middleHairKey = `hair_${index}_middle`;
          const backHairKey = `hair_${index}_back`;
          
          if (!filesByName[middleHairKey] || filesByName[middleHairKey].length === 0) {
            throw new Error(`Middle hair image is required for color option ${index + 1}: ${colorOption.colorName}`);
          }

          try {
            // 리소스 이미지 객체 초기화
            resourceImages = {} as { hairMiddleImageUrl: string; hairBackImageUrl?: string };
            
            // 중간머리 처리 (필수)
            const middleHairFile = filesByName[middleHairKey]![0];
            if (!middleHairFile.buffer) {
              throw new Error('Middle hair file buffer is missing');
            }
            const middleResult = await uploadToFirebase(middleHairFile, 'uploads/hair/');
            resourceImages.hairMiddleImageUrl = middleResult.url;

            // 뒷머리 처리 (선택사항)
            if (filesByName[backHairKey] && filesByName[backHairKey].length > 0) {
              const backHairFile = filesByName[backHairKey][0];
              if (!backHairFile.buffer) {
                throw new Error('Back hair file buffer is missing');
              }
              const backResult = await uploadToFirebase(backHairFile, 'uploads/hair/');
              resourceImages.hairBackImageUrl = backResult.url;
            }

          } catch (error) {
            console.error(`Error processing hair images for color option ${index}:`, error);
            throw new Error(`Failed to process hair images for color option: ${colorOption.colorName}`);
          }
        }

        // Hair 카테고리에서 imageUrl 결정
        let finalImageUrl = colorOption.imageUrl;
        if (isHairCategory) {
          // 중간머리가 있으면 사용, 없으면 기존 imageUrl 유지
          finalImageUrl = resourceImages?.hairMiddleImageUrl || colorOption.imageUrl;
          // Hair 카테고리에서 imageUrl이 여전히 없으면 에러
          if (!finalImageUrl) {
            throw new Error(`Hair category requires middle hair image for color option: ${colorOption.colorName}`);
          }
        }

        const result = {
          colorName: colorOption.colorName,
          imageUrl: finalImageUrl,
          paletteImageUrl,
          ...(isHairCategory && { resourceImages })
        };
        
        // 마지막 컬러 옵션인 경우 특별히 강조해서 로깅
        if (index === parsedColorOptions.length - 1) {
          console.log(`🎯 ⭐ 마지막 컬러 옵션 ${index} 처리 완료 (중요!):`, {
            colorName: result.colorName,
            imageUrl: result.imageUrl?.substring(0, 50) + '...',
            paletteImageUrl: result.paletteImageUrl ? result.paletteImageUrl.substring(0, 50) + '...' : '❌❌❌ 없음',
            paletteImageUrlFull: result.paletteImageUrl || '❌❌❌ 완전히 없음',
            hasResourceImages: !!result.resourceImages,
            isLastIndex: true
          });
        } else {
          console.log(`✅ 컬러 옵션 ${index} 처리 완료:`, {
            colorName: result.colorName,
            imageUrl: result.imageUrl?.substring(0, 50) + '...',
            paletteImageUrl: result.paletteImageUrl ? result.paletteImageUrl.substring(0, 50) + '...' : '없음',
            hasResourceImages: !!result.resourceImages
          });
        }
        
        return result;
      })
    );
    
    console.log(`🎯 전체 컬러 옵션 처리 완료:`, {
      totalOptions: processedColorOptions.length,
      optionsWithPalette: processedColorOptions.filter(opt => opt.paletteImageUrl).length,
      optionsWithoutPalette: processedColorOptions.filter(opt => !opt.paletteImageUrl).length
    });

    // 첫 번째 컬러 옵션의 이미지를 메인 이미지로 사용
    const mainImageUrl = processedColorOptions[0]?.imageUrl;
    console.log(`🔍 메인 이미지 URL (썸네일 생성용):`, mainImageUrl);
    if (!mainImageUrl) {
      res.status(400).json({ message: 'First color option must have an imageUrl' });
      return;
    }

    // 썸네일 처리 (첫 번째 컬러 옵션 이미지 기준)
    let thumbnailUrl = '';
    let thumbnailSource: 'user' | 'auto' = 'auto';

    if (filesByName.thumbnail && filesByName.thumbnail.length > 0) {
      // 사용자가 썸네일을 제공한 경우
      const thumbnailFile = filesByName.thumbnail[0];
      if (!thumbnailFile) {
        res.status(400).json({ message: 'Thumbnail file is invalid' });
        return;
      }
      // Firebase Storage에 썸네일 직접 업로드
      if (!thumbnailFile.buffer) {
        res.status(400).json({ message: 'Thumbnail file buffer is missing' });
        return;
      }
      
      const thumbnailUploadResult = await uploadToFirebaseStorage(thumbnailFile, 'thumbnails/');
      thumbnailUrl = thumbnailUploadResult.url;
      thumbnailSource = 'user';
    } else {
      // 첫 번째 컬러 옵션 이미지로 자동 썸네일 생성
      // mainImageUrl을 ThumbnailGenerator에 직접 전달 (Firebase Storage URL 또는 로컬 경로)
      console.log(`🔍 썸네일 생성용 이미지 URL:`, mainImageUrl);
      const thumbnailResult = await ThumbnailGenerator.generateThumbnail(mainImageUrl);
      thumbnailUrl = thumbnailResult.thumbnailUrl;
      thumbnailSource = 'auto';
    }

    const newOption: any = {
      name,
      imageUrl: mainImageUrl,
      thumbnailUrl,
      thumbnailSource,
      color: processedColorOptions,
      order: parseInt(order) || 0
    };

    category.options.push(newOption as any);
    await category.save();

    // 저장 후 실제 DB에서 데이터 재조회하여 검증
    const savedCategory = await AvatarCategory.findById(id);
    const savedOption = savedCategory?.options[savedCategory.options.length - 1];
    
    console.log('💾 DB 저장 후 실제 데이터 검증:', {
      savedOptionName: savedOption?.name,
      savedColorOptionsCount: savedOption?.color?.length || 0,
      savedColorOptions: savedOption?.color?.map((colorOpt: any, index: number) => ({
        index,
        colorName: colorOpt.colorName,
        imageUrl: colorOpt.imageUrl?.substring(0, 50) + '...',
        paletteImageUrl: colorOpt.paletteImageUrl ? colorOpt.paletteImageUrl.substring(0, 50) + '...' : '❌ 없음',
        hasPaletteUrl: !!colorOpt.paletteImageUrl
      }))
    });

    res.status(201).json({ 
      message: 'Avatar option added successfully', 
      option: newOption,
      category: category.name,
      // 디버깅을 위해 실제 저장된 데이터도 포함
      savedOption: savedOption
    });
  } catch (error) {
    console.error('Error adding avatar option:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAvatarOption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, optionId } = req.params;
    const { name, colorOptions, order } = req.body;
    const files = req.files as Express.Multer.File[];

    const category = await AvatarCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    const optionIndex = category.options.findIndex(opt => (opt as any)._id?.toString() === optionId);
    if (optionIndex === -1) {
      res.status(404).json({ message: 'Avatar option not found' });
      return;
    }

    const option = category.options[optionIndex];

    // 기존 파일 경로 저장 (삭제용)
    const oldThumbnailPath = option.thumbnailUrl ? getThumbnailPathFromUrl(option.thumbnailUrl) : '';

    // 기본 정보 업데이트
    if (name !== undefined) option.name = name;
    if (order !== undefined) option.order = parseInt(order);

    // hair 카테고리 감지
    const isHairCategory = category.type === 'hair';

    // 파일 배열을 객체로 변환 (upload.any() 사용으로 인해)
    const filesByName: { [key: string]: Express.Multer.File[] } = {};
    if (Array.isArray(files)) {
      files.forEach(file => {
        if (!filesByName[file.fieldname]) {
          filesByName[file.fieldname] = [];
        }
        filesByName[file.fieldname].push(file);
      });
    }

    // 컬러 옵션 업데이트
    if (colorOptions !== undefined) {
      let parsedColorOptions;
      try {
        parsedColorOptions = typeof colorOptions === 'string' ? JSON.parse(colorOptions) : colorOptions;
      } catch (error) {
        res.status(400).json({ message: 'Invalid colorOptions format' });
        return;
      }

      if (!parsedColorOptions || !Array.isArray(parsedColorOptions) || parsedColorOptions.length === 0) {
        res.status(400).json({ message: 'At least one color option is required' });
        return;
      }

      // 기존 팔레트 이미지들 삭제
      if (option.color && Array.isArray(option.color)) {
        for (const colorOpt of option.color) {
          if (colorOpt.paletteImageUrl) {
            await PaletteImageProcessor.deletePaletteImage(colorOpt.paletteImageUrl);
          }
        }
      }

      // 업데이트 모드 - 팔레트 파일 매칭 로직 개선
      const paletteFiles: Express.Multer.File[] = [];
      
      // 방법 1: palette_0, palette_1, palette_2 형태로 전송된 경우
      for (let i = 0; i < parsedColorOptions.length; i++) {
        const paletteKey = `palette_${i}`;
        if (filesByName[paletteKey] && filesByName[paletteKey].length > 0) {
          paletteFiles[i] = filesByName[paletteKey][0];
        }
      }
      
      // 방법 2: palette 필드로 여러 파일이 온 경우 (기존 방식)
      if (paletteFiles.filter(f => f).length === 0 && filesByName.palette) {
        filesByName.palette.forEach((file, index) => {
          if (index < parsedColorOptions.length) {
            paletteFiles[index] = file;
          }
        });
      }
      
      // 방법 3: palette[0], palette[1], palette[2] 형태로 전송된 경우
      if (paletteFiles.filter(f => f).length === 0) {
        for (let i = 0; i < parsedColorOptions.length; i++) {
          const paletteKey = `palette[${i}]`;
          if (filesByName[paletteKey] && filesByName[paletteKey].length > 0) {
            paletteFiles[i] = filesByName[paletteKey][0];
          }
        }
      }
      
      console.log(`🔍 업데이트 모드 - 개선된 팔레트 파일 매칭 결과:`, {
        colorOptionsLength: parsedColorOptions.length,
        paletteFilesLength: paletteFiles.length,
        matchedFiles: paletteFiles.map((f, i) => ({
          index: i,
          hasFile: !!f,
          fileName: f?.originalname || '없음',
          fileSize: f?.size || 0
        })),
        totalMatchedFiles: paletteFiles.filter(f => f).length
      });
      
      // 컬러 옵션과 팔레트 파일 수 불일치 경고  
      const matchedFileCount = paletteFiles.filter(f => f).length;
      if (matchedFileCount > 0 && matchedFileCount !== parsedColorOptions.length) {
        console.warn(`⚠️ 업데이트 모드 - 팔레트 파일 수(${matchedFileCount})와 컬러 옵션 수(${parsedColorOptions.length})가 일치하지 않습니다!`);
      }
      
      const processedColorOptions = await Promise.all(
        parsedColorOptions.map(async (colorOption: any, index: number) => {
          let paletteImageUrl = '';
          let resourceImages: { hairMiddleImageUrl: string; hairBackImageUrl?: string } | undefined;
          
          const paletteFile = paletteFiles[index];
          console.log(`🔍 업데이트 처리 중 - 컬러 옵션 ${index}:`, {
            colorName: colorOption.colorName,
            hasPaletteFile: !!paletteFile,
            paletteFileName: paletteFile?.originalname,
            paletteFileSize: paletteFile?.size,
            paletteHasBuffer: !!paletteFile?.buffer,
            existingPaletteUrl: colorOption.paletteImageUrl,
            availablePaletteFiles: paletteFiles.length,
            maxIndex: paletteFiles.length - 1
          });
          
          // 해당 인덱스에 팔레트 이미지가 있으면 처리
          if (paletteFile && paletteFile.buffer) {
            try {
              console.log(`🔄 업데이트 - 팔레트 이미지 업로드 시작 (색상 옵션 ${index}): ${paletteFile.originalname}`);
              // Firebase Storage에 팔레트 이미지 업로드
              const uploadResult = await uploadToFirebaseStorage(paletteFile, 'palettes/');
              paletteImageUrl = uploadResult.url;
              console.log(`✅ 업데이트 - 팔레트 이미지 업로드 완료 (색상 옵션 ${index}):`, {
                originalName: paletteFile.originalname,
                uploadedUrl: uploadResult.url
              });
            } catch (error) {
              console.error(`❌ 업데이트 - 팔레트 이미지 업로드 실패 (색상 옵션 ${index}):`, {
                fileName: paletteFile.originalname,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          } else if (paletteFile && !paletteFile.buffer) {
            console.error(`❌ 업데이트 - 팔레트 파일 버퍼 없음 (색상 옵션 ${index}):`, paletteFile.originalname);
          } else if (colorOption.paletteImageUrl) {
            // 기존 팔레트 이미지 유지
            paletteImageUrl = colorOption.paletteImageUrl;
            console.log(`ℹ️ 업데이트 - 기존 팔레트 이미지 유지 (색상 옵션 ${index}):`, colorOption.paletteImageUrl);
          } else {
            console.log(`ℹ️ 업데이트 - 팔레트 파일 없음 (색상 옵션 ${index}): ${colorOption.colorName}`);
          }

          // hair 카테고리인 경우 리소스 이미지 처리
          if (isHairCategory) {
            const middleHairKey = `hair_${index}_middle`;
            const backHairKey = `hair_${index}_back`;
            
            try {
              // 리소스 이미지 객체 초기화
              resourceImages = {} as { hairMiddleImageUrl: string; hairBackImageUrl?: string };
              
              // 기존 resourceImages 처리
              if (colorOption.resourceImages) {
                if (colorOption.resourceImages.hairMiddleImageUrl) {
                  resourceImages.hairMiddleImageUrl = colorOption.resourceImages.hairMiddleImageUrl;
                }
                if (colorOption.resourceImages.hairBackImageUrl) {
                  resourceImages.hairBackImageUrl = colorOption.resourceImages.hairBackImageUrl;
                }
              } else if (colorOption.imageUrl) {
                // 기존 Hair 옵션에서 resourceImages가 없는 경우, imageUrl을 중간머리로 사용
                resourceImages.hairMiddleImageUrl = colorOption.imageUrl;
              }
              
              // 중간머리 처리 (필수)
              if (filesByName[middleHairKey] && filesByName[middleHairKey].length > 0) {
                const middleHairFile = filesByName[middleHairKey][0];
                if (!middleHairFile.buffer) {
                  throw new Error('Middle hair file buffer is missing');
                }
                const middleResult = await uploadToFirebase(middleHairFile, 'uploads/hair/');
                resourceImages.hairMiddleImageUrl = middleResult.url;
              }

              // 뒷머리 처리 (선택사항)
              if (filesByName[backHairKey] && filesByName[backHairKey].length > 0) {
                const backHairFile = filesByName[backHairKey][0];
                if (!backHairFile.buffer) {
                  throw new Error('Back hair file buffer is missing');
                }
                const backResult = await uploadToFirebase(backHairFile, 'uploads/hair/');
                resourceImages.hairBackImageUrl = backResult.url;
              }

            } catch (error) {
              console.error(`Error processing hair images for color option ${index}:`, error);
            }
          }

          // Hair 카테고리에서 imageUrl 결정
          let finalImageUrl = colorOption.imageUrl;
          if (isHairCategory && resourceImages) {
            // 중간머리가 있으면 사용, 없으면 기존 imageUrl 유지
            finalImageUrl = resourceImages.hairMiddleImageUrl || colorOption.imageUrl;
          }

          const result = {
            colorName: colorOption.colorName,
            imageUrl: finalImageUrl,
            paletteImageUrl,
            ...(isHairCategory && { resourceImages })
          };
          
          // 마지막 컬러 옵션인 경우 특별히 강조해서 로깅
          if (index === parsedColorOptions.length - 1) {
            console.log(`🎯 ⭐ 업데이트 - 마지막 컬러 옵션 ${index} 처리 완료 (중요!):`, {
              colorName: result.colorName,
              imageUrl: result.imageUrl?.substring(0, 50) + '...',
              paletteImageUrl: result.paletteImageUrl ? result.paletteImageUrl.substring(0, 50) + '...' : '❌❌❌ 없음',
              paletteImageUrlFull: result.paletteImageUrl || '❌❌❌ 완전히 없음',
              hasResourceImages: !!result.resourceImages,
              isLastIndex: true
            });
          } else {
            console.log(`✅ 업데이트 - 컬러 옵션 ${index} 처리 완료:`, {
              colorName: result.colorName,
              imageUrl: result.imageUrl?.substring(0, 50) + '...',
              paletteImageUrl: result.paletteImageUrl ? result.paletteImageUrl.substring(0, 50) + '...' : '없음',
              hasResourceImages: !!result.resourceImages
            });
          }
          
          return result;
        })
      );
      
      console.log(`🎯 업데이트 - 전체 컬러 옵션 처리 완료:`, {
        totalOptions: processedColorOptions.length,
        optionsWithPalette: processedColorOptions.filter(opt => opt.paletteImageUrl).length,
        optionsWithoutPalette: processedColorOptions.filter(opt => !opt.paletteImageUrl).length
      });

      option.color = processedColorOptions;
      
      // 첫 번째 컬러 옵션의 이미지를 메인 이미지로 업데이트
      const newMainImageUrl = processedColorOptions[0]?.imageUrl;
      console.log(`🔍 업데이트 - 새 메인 이미지 URL:`, newMainImageUrl, `기존:`, option.imageUrl);
      if (newMainImageUrl && newMainImageUrl !== option.imageUrl) {
        option.imageUrl = newMainImageUrl;
        
        // 메인 이미지가 변경되면 썸네일도 재생성 (자동 생성인 경우)
        if (option.thumbnailSource === 'auto') {
          // 기존 썸네일 삭제
          if (oldThumbnailPath) {
            await deleteFileIfExists(oldThumbnailPath);
          }

          console.log(`🔍 업데이트 - 썸네일 생성용 이미지 URL:`, newMainImageUrl);
          const thumbnailResult = await ThumbnailGenerator.generateThumbnail(newMainImageUrl);
          option.thumbnailUrl = thumbnailResult.thumbnailUrl;
        }
      }
    }

    // 새 썸네일이 있는 경우
    if (filesByName.thumbnail && filesByName.thumbnail.length > 0) {
      const thumbnailFile = filesByName.thumbnail[0];
      if (thumbnailFile) {
        // Firebase Storage 사용 시 로컬 파일 삭제 불필요

        // Firebase Storage에 썸네일 직접 업로드
        if (!thumbnailFile.buffer) {
          res.status(400).json({ message: 'Thumbnail file buffer is missing' });
          return;
        }
        
        const thumbnailUploadResult = await uploadToFirebaseStorage(thumbnailFile, 'thumbnails/');
        option.thumbnailUrl = thumbnailUploadResult.url;
        option.thumbnailSource = 'user';
      }
    }

    await category.save();

    // 업데이트 후 실제 DB에서 데이터 재조회하여 검증
    const updatedCategory = await AvatarCategory.findById(categoryId);
    const updatedOption = updatedCategory?.options.find(opt => (opt as any)._id?.toString() === optionId);
    
    console.log('💾 업데이트 후 DB 실제 데이터 검증:', {
      updatedOptionName: updatedOption?.name,
      updatedColorOptionsCount: updatedOption?.color?.length || 0,
      updatedColorOptions: updatedOption?.color?.map((colorOpt: any, index: number) => ({
        index,
        colorName: colorOpt.colorName,
        imageUrl: colorOpt.imageUrl?.substring(0, 50) + '...',
        paletteImageUrl: colorOpt.paletteImageUrl ? colorOpt.paletteImageUrl.substring(0, 50) + '...' : '❌ 없음',
        hasPaletteUrl: !!colorOpt.paletteImageUrl
      }))
    });

    res.json({ 
      message: 'Avatar option updated successfully', 
      option,
      category: category.name,
      // 디버깅을 위해 실제 업데이트된 데이터도 포함
      updatedOption: updatedOption
    });
  } catch (error) {
    console.error('Error updating avatar option:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAvatarOption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, optionId } = req.params;

    const category = await AvatarCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    const optionIndex = category.options.findIndex(opt => (opt as any)._id?.toString() === optionId);
    if (optionIndex === -1) {
      res.status(404).json({ message: 'Avatar option not found' });
      return;
    }

    const option = category.options[optionIndex];

    // 관련 파일들 삭제
    if (option.imageUrl) {
      const imagePath = getFilePathFromUrl(option.imageUrl);
      await deleteFileIfExists(imagePath);
    }
    if (option.thumbnailUrl) {
      const thumbnailPath = getThumbnailPathFromUrl(option.thumbnailUrl);
      await deleteFileIfExists(thumbnailPath);
    }
    
    // 팔레트 이미지들 삭제
    if (option.color && Array.isArray(option.color)) {
      for (const colorOpt of option.color) {
        if (colorOpt.paletteImageUrl) {
          await PaletteImageProcessor.deletePaletteImage(colorOpt.paletteImageUrl);
        }
      }
    }

    category.options.splice(optionIndex, 1);
    await category.save();

    res.json({ message: 'Avatar option deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar option:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const regenerateThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, optionId } = req.params;

    const category = await AvatarCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    const optionIndex = category.options.findIndex(opt => (opt as any)._id?.toString() === optionId);
    if (optionIndex === -1) {
      res.status(404).json({ message: 'Avatar option not found' });
      return;
    }

    const option = category.options[optionIndex];
    
    if (!option.imageUrl) {
      res.status(400).json({ message: 'No image URL found for this option' });
      return;
    }
    
    // 기존 썸네일 삭제
    if (option.thumbnailUrl) {
      const oldThumbnailPath = getThumbnailPathFromUrl(option.thumbnailUrl);
      await deleteFileIfExists(oldThumbnailPath);
    }
    
    // 썸네일 재생성 (Firebase Storage URL 또는 로컬 경로 자동 처리)
    const thumbnailResult = await ThumbnailGenerator.generateThumbnail(option.imageUrl);
    option.thumbnailUrl = thumbnailResult.thumbnailUrl;
    option.thumbnailSource = 'auto';

    await category.save();

    res.json({ 
      message: 'Thumbnail regenerated successfully', 
      thumbnailUrl: option.thumbnailUrl
    });
  } catch (error) {
    console.error('Error regenerating thumbnail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};