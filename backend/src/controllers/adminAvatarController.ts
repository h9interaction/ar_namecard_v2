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

    // 디버깅: 받은 파일들 로그
    console.log('🔍 받은 파일들:', Object.keys(filesByName));
    if (isHairCategory) {
      console.log('💇‍♀️ Hair 카테고리 파일들:', Object.keys(filesByName).filter(key => key.startsWith('hair_')));
    }

    // 팔레트 이미지 및 hair 리소스 이미지 처리
    const paletteFiles = filesByName.palette || [];
    console.log(`🔍 받은 팔레트 파일들:`, {
      paletteFilesLength: paletteFiles.length,
      colorOptionsLength: parsedColorOptions.length,
      paletteFileNames: paletteFiles.map((f, i) => `${i}: ${f.originalname}`)
    });
    
    const processedColorOptions = await Promise.all(
      parsedColorOptions.map(async (colorOption: any, index: number) => {
        let paletteImageUrl = '';
        let resourceImages: { hairMiddleImageUrl: string; hairBackImageUrl?: string } | undefined;
        
        console.log(`🔍 처리 중 - 컬러 옵션 ${index}:`, {
          colorName: colorOption.colorName,
          hasPaletteFile: !!paletteFiles[index],
          paletteFileName: paletteFiles[index]?.originalname
        });
        
        // 해당 인덱스에 팔레트 이미지가 있으면 처리
        if (paletteFiles[index]) {
          try {
            // Firebase Storage에 팔레트 이미지 업로드
            const uploadResult = await uploadToFirebaseStorage(paletteFiles[index], 'palettes/');
            paletteImageUrl = uploadResult.url;
            console.log(`✅ 팔레트 이미지 업로드 완료 (색상 옵션 ${index}):`, uploadResult.url);
          } catch (error) {
            console.error(`Error processing palette image for color option ${index}:`, error);
          }
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

        return {
          colorName: colorOption.colorName,
          imageUrl: finalImageUrl,
          paletteImageUrl,
          ...(isHairCategory && { resourceImages })
        };
      })
    );

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

    res.status(201).json({ 
      message: 'Avatar option added successfully', 
      option: newOption,
      category: category.name
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

      // 새로운 팔레트 이미지 및 hair 리소스 이미지 처리
      const paletteFiles = filesByName.palette || [];
      console.log(`🔍 업데이트 모드 - 받은 팔레트 파일들:`, {
        paletteFilesLength: paletteFiles.length,
        colorOptionsLength: parsedColorOptions.length,
        paletteFileNames: paletteFiles.map((f, i) => `${i}: ${f.originalname}`)
      });
      
      const processedColorOptions = await Promise.all(
        parsedColorOptions.map(async (colorOption: any, index: number) => {
          let paletteImageUrl = '';
          let resourceImages: { hairMiddleImageUrl: string; hairBackImageUrl?: string } | undefined;
          
          console.log(`🔍 업데이트 처리 중 - 컬러 옵션 ${index}:`, {
            colorName: colorOption.colorName,
            hasPaletteFile: !!paletteFiles[index],
            paletteFileName: paletteFiles[index]?.originalname,
            existingPaletteUrl: colorOption.paletteImageUrl
          });
          
          // 해당 인덱스에 팔레트 이미지가 있으면 처리
          if (paletteFiles[index]) {
            try {
              // Firebase Storage에 팔레트 이미지 업로드
              const uploadResult = await uploadToFirebaseStorage(paletteFiles[index], 'palettes/');
              paletteImageUrl = uploadResult.url;
              console.log(`✅ 팔레트 이미지 업로드 완료 (색상 옵션 ${index}):`, uploadResult.url);
            } catch (error) {
              console.error(`Error processing palette image for color option ${index}:`, error);
            }
          } else if (colorOption.paletteImageUrl) {
            // 기존 팔레트 이미지 유지
            paletteImageUrl = colorOption.paletteImageUrl;
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

          return {
            colorName: colorOption.colorName,
            imageUrl: finalImageUrl,
            paletteImageUrl,
            ...(isHairCategory && { resourceImages })
          };
        })
      );

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

    res.json({ 
      message: 'Avatar option updated successfully', 
      option,
      category: category.name
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