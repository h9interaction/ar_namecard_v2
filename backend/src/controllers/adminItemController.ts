import { Request, Response } from 'express';
import { ItemCategory } from '../models';
import { validationResult } from 'express-validator';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import { uploadToFirebase } from '../config/firebase-storage';
import path from 'path';
import fs from 'fs/promises';

interface AuthRequest extends Request {
  user?: any;
}

interface MulterFiles {
  image?: Express.Multer.File[];
  thumbnail?: Express.Multer.File[];
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

export const getAllItemCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { type } = req.query;
    const query = type ? { type } : {};

    const categories = await ItemCategory.find(query).sort({ order: 1 });
    res.json({ categories, total: categories.length });
  } catch (error) {
    console.error('Error fetching item categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getItemCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const category = await ItemCategory.findById(id);

    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching item category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createItemCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const existingCategory = await ItemCategory.findOne({ type });
    if (existingCategory) {
      res.status(400).json({ message: 'Item category with this type already exists' });
      return;
    }

    // 썸네일 이미지 업로드 처리
    let thumbnailUrl = '';
    if (req.file) {
      try {
        console.log('📤 카테고리 썸네일 업로드 시작:', {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        const uploadResult = await uploadToFirebase(req.file, 'categories/thumbnails/');
        thumbnailUrl = uploadResult.url;
        console.log('✅ 카테고리 썸네일 업로드 성공:', thumbnailUrl);
      } catch (uploadError) {
        console.error('❌ 카테고리 썸네일 업로드 실패:', uploadError);
        res.status(500).json({ 
          message: '썸네일 이미지 업로드 실패', 
          error: uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'
        });
        return;
      }
    }

    const category = new ItemCategory({
      name,
      type,
      thumbnailUrl: thumbnailUrl || undefined,
      thumbnailSource: thumbnailUrl ? 'user' : 'auto',
      items: [],
      order
    });

    await category.save();
    res.status(201).json({ message: 'Item category created successfully', category });
  } catch (error) {
    console.error('Error creating item category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateItemCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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
      const existingCategory = await ItemCategory.findOne({ type, _id: { $ne: id } });
      if (existingCategory) {
        res.status(400).json({ message: 'Item category with this type already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (order !== undefined) updateData.order = order;

    // 썸네일 이미지 업로드 처리
    if (req.file) {
      try {
        console.log('📤 카테고리 썸네일 업데이트 시작:', {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        const uploadResult = await uploadToFirebase(req.file, 'categories/thumbnails/');
        updateData.thumbnailUrl = uploadResult.url;
        updateData.thumbnailSource = 'user';
        console.log('✅ 카테고리 썸네일 업데이트 성공:', updateData.thumbnailUrl);
      } catch (uploadError) {
        console.error('❌ 카테고리 썸네일 업데이트 실패:', uploadError);
        res.status(500).json({ 
          message: '썸네일 이미지 업로드 실패', 
          error: uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'
        });
        return;
      }
    }

    const category = await ItemCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    res.json({ message: 'Item category updated successfully', category });
  } catch (error) {
    console.error('Error updating item category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteItemCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const category = await ItemCategory.findById(id);

    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    // 카테고리의 모든 아이템 이미지 및 썸네일 삭제
    for (const item of category.items) {
      if (item.imageUrl) {
        const imagePath = getFilePathFromUrl(item.imageUrl);
        await deleteFileIfExists(imagePath);
      }
      if (item.thumbnailUrl) {
        const thumbnailPath = getThumbnailPathFromUrl(item.thumbnailUrl);
        await deleteFileIfExists(thumbnailPath);
      }
    }

    await ItemCategory.findByIdAndDelete(id);
    res.json({ message: 'Item category deleted successfully' });
  } catch (error) {
    console.error('Error deleting item category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { name, order = 0, frames, columns = 16, duration, animationType } = req.body;
    const files = req.files as MulterFiles;

    if (!files || !files.image || files.image.length === 0) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }

    const category = await ItemCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    const imageFile = files.image[0];
    if (!imageFile) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }

    // Firebase Storage에 이미지 업로드 (메모리에서 직접 사용)
    if (!imageFile.buffer) {
      res.status(400).json({ message: 'Image file buffer is missing' });
      return;
    }
    
    const imageResult = await uploadToFirebase(imageFile, 'uploads/items/');
    const imageUrl = imageResult.url;

    // 애니메이션 정보 처리
    let animation = undefined;
    if (animationType && animationType !== 'none') {
      // 애니메이션이 있는 경우만 animation 객체 생성
      if (frames && columns && duration) {
        animation = {
          frames: parseInt(frames),
          columns: parseInt(columns),
          duration: parseInt(duration),
          type: animationType
        };
      }
    }

    // 썸네일 처리
    let thumbnailUrl = '';
    let thumbnailSource: 'user' | 'auto' = 'auto';

    if (files.thumbnail && files.thumbnail.length > 0) {
      // 사용자가 썸네일을 제공한 경우
      const thumbnailFile = files.thumbnail[0];
      if (!thumbnailFile) {
        res.status(400).json({ message: 'Thumbnail file is invalid' });
        return;
      }
      // Firebase Storage에 썸네일 직접 업로드
      if (!thumbnailFile.buffer) {
        res.status(400).json({ message: 'Thumbnail file buffer is missing' });
        return;
      }
      
      const thumbnailUploadResult = await uploadToFirebase(thumbnailFile, 'uploads/thumbnails/');
      thumbnailUrl = thumbnailUploadResult.url;
      thumbnailSource = 'user';
    } else if (animation) {
      // 스프라이트 이미지에서 첫 번째 프레임 추출 (Firebase Storage URL 사용)
      const rows = Math.ceil(animation.frames / animation.columns);
      const thumbnailResult = await ThumbnailGenerator.generateThumbnailFromSprite(
        imageUrl, // Firebase Storage URL 사용
        animation.columns,
        rows,
        imageFile.filename
      );
      thumbnailUrl = thumbnailResult.thumbnailUrl;
      thumbnailSource = 'auto';
    } else {
      // 일반 이미지에서 썸네일 생성 (Firebase Storage URL 사용)
      const thumbnailResult = await ThumbnailGenerator.generateThumbnail(
        imageUrl,
        imageFile.filename
      );
      thumbnailUrl = thumbnailResult.thumbnailUrl;
      thumbnailSource = 'auto';
    }

    const newItem = {
      name,
      imageUrl,
      animationUrl: animation ? imageUrl : undefined,
      animation,
      thumbnailUrl,
      thumbnailSource,
      order: parseInt(order) || 0
    };

    category.items.push(newItem as any);
    await category.save();

    res.status(201).json({ 
      message: 'Item added successfully', 
      item: newItem,
      category: category.name
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, itemId } = req.params;
    const { name, order, frames, columns, duration, animationType } = req.body;
    const files = req.files as MulterFiles;

    const category = await ItemCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    const itemIndex = category.items.findIndex(item => (item as any)._id?.toString() === itemId);
    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    const item = category.items[itemIndex];

    // 기존 파일 경로 저장 (삭제용)
    const oldImagePath = item.imageUrl ? getFilePathFromUrl(item.imageUrl) : '';
    const oldThumbnailPath = item.thumbnailUrl ? getThumbnailPathFromUrl(item.thumbnailUrl) : '';

    // 기본 정보 업데이트
    if (name !== undefined) item.name = name;
    if (order !== undefined) item.order = parseInt(order);

    // 애니메이션 정보 업데이트
    if (animationType !== undefined) {
      if (animationType === 'none' || animationType === '') {
        // 애니메이션 없음 또는 선택 안함인 경우 animation 제거
        item.animation = undefined;
        item.animationUrl = undefined;
      } else {
        // 애니메이션이 있는 경우
        if (!item.animation) {
          item.animation = {
            frames: parseInt(frames) || 1,
            columns: parseInt(columns) || 1,
            duration: parseInt(duration) || 1000,
            type: animationType
          };
        } else {
          if (frames !== undefined) item.animation.frames = parseInt(frames);
          if (columns !== undefined) item.animation.columns = parseInt(columns);
          if (duration !== undefined) item.animation.duration = parseInt(duration);
          item.animation.type = animationType;
        }
        item.animationUrl = item.imageUrl;
      }
    } else if (frames || columns || duration) {
      // animationType이 undefined이지만 다른 애니메이션 정보가 있는 경우
      if (!item.animation) {
        item.animation = {
          frames: parseInt(frames) || 1,
          columns: parseInt(columns) || 1,
          duration: parseInt(duration) || 1000,
          type: 'loop'
        };
      } else {
        if (frames !== undefined) item.animation.frames = parseInt(frames);
        if (columns !== undefined) item.animation.columns = parseInt(columns);
        if (duration !== undefined) item.animation.duration = parseInt(duration);
      }
    }

    // 새 이미지가 있는 경우
    if (files && files.image && files.image.length > 0) {
      const imageFile = files.image[0];
      if (imageFile) {
        // Firebase Storage 사용 시 로컬 파일 삭제 불필요 (URL이므로)
        // 기존 Firebase Storage 파일은 자동으로 관리됨

        // Firebase Storage에 새 이미지 업로드 (메모리에서 직접 사용)
        if (!imageFile.buffer) {
          res.status(400).json({ message: 'Image file buffer is missing' });
          return;
        }
        
        const imageResult = await uploadToFirebase(imageFile, 'uploads/items/');
        item.imageUrl = imageResult.url;
        
        if (item.animation) {
          item.animationUrl = item.imageUrl;
        }

        // 기존 썸네일이 자동 생성된 것이면 새로 생성
        if (item.thumbnailSource === 'auto') {
          // Firebase Storage 사용 시 썸네일도 URL이므로 로컬 삭제 불필요

          let thumbnailResult;
          if (item.animation) {
            const rows = Math.ceil(item.animation.frames / item.animation.columns);
            thumbnailResult = await ThumbnailGenerator.generateThumbnailFromSprite(
              item.imageUrl, // Firebase Storage URL 사용
              item.animation.columns,
              rows,
              imageFile.filename
            );
          } else {
            thumbnailResult = await ThumbnailGenerator.generateThumbnail(
              item.imageUrl, // Firebase Storage URL 사용
              imageFile.filename
            );
          }
          item.thumbnailUrl = thumbnailResult.thumbnailUrl;
        }
      }
    }

    // 새 썸네일이 있는 경우
    if (files && files.thumbnail && files.thumbnail.length > 0) {
      const thumbnailFile = files.thumbnail[0];
      if (thumbnailFile) {
        // Firebase Storage 사용 시 썸네일 파일도 URL이므로 로컬 삭제 불필요

        // Firebase Storage에 썸네일 업로드 후 처리
        if (!thumbnailFile.buffer) {
          res.status(400).json({ message: 'Thumbnail file buffer is missing' });
          return;
        }
        
        const thumbnailUploadResult = await uploadToFirebase(thumbnailFile, 'uploads/thumbnails/');
        item.thumbnailUrl = thumbnailUploadResult.url;
        item.thumbnailSource = 'user';
      }
    }

    await category.save();

    res.json({ 
      message: 'Item updated successfully', 
      item,
      category: category.name
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, itemId } = req.params;

    const category = await ItemCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    const itemIndex = category.items.findIndex(item => (item as any)._id?.toString() === itemId);
    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    const item = category.items[itemIndex];

    // 관련 파일들 삭제
    if (item.imageUrl) {
      const imagePath = getFilePathFromUrl(item.imageUrl);
      await deleteFileIfExists(imagePath);
    }
    if (item.thumbnailUrl) {
      const thumbnailPath = getThumbnailPathFromUrl(item.thumbnailUrl);
      await deleteFileIfExists(thumbnailPath);
    }

    category.items.splice(itemIndex, 1);
    await category.save();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const regenerateItemThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { categoryId, itemId } = req.params;

    const category = await ItemCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ message: 'Item category not found' });
      return;
    }

    const itemIndex = category.items.findIndex(item => (item as any)._id?.toString() === itemId);
    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    const item = category.items[itemIndex];
    
    // 원본 이미지 경로 추출
    const imagePath = path.join(process.cwd(), 'uploads', path.basename(item.imageUrl));
    
    // 기존 썸네일 삭제
    if (item.thumbnailUrl) {
      const oldThumbnailPath = getThumbnailPathFromUrl(item.thumbnailUrl);
      await deleteFileIfExists(oldThumbnailPath);
    }
    
    // 썸네일 재생성
    let thumbnailResult;
    if (item.animation) {
      const rows = Math.ceil(item.animation.frames / item.animation.columns);
      thumbnailResult = await ThumbnailGenerator.generateThumbnailFromSprite(
        imagePath,
        item.animation.columns,
        rows
      );
    } else {
      thumbnailResult = await ThumbnailGenerator.generateThumbnail(imagePath);
    }
    
    item.thumbnailUrl = thumbnailResult.thumbnailUrl;
    item.thumbnailSource = 'auto';

    await category.save();

    res.json({ 
      message: 'Thumbnail regenerated successfully', 
      thumbnailUrl: item.thumbnailUrl
    });
  } catch (error) {
    console.error('Error regenerating thumbnail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};