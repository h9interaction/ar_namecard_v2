import { Request, Response } from 'express';
import { AvatarCategory } from '../models';
import { validationResult } from 'express-validator';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import path from 'path';
import fs from 'fs/promises'; // Added fs import

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

export const getAllAvatarCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { type } = req.query;
    const query = type ? { type } : {};

    const categories = await AvatarCategory.find(query).sort({ order: 1 });
    res.json({ categories, total: categories.length });
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

    res.json(category);
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

    // 카테고리의 모든 옵션 이미지 및 썸네일 삭제
    for (const option of category.options) {
      if (option.imageUrl) {
        const imagePath = getFilePathFromUrl(option.imageUrl);
        await deleteFileIfExists(imagePath);
      }
      if (option.thumbnailUrl) {
        const thumbnailPath = getThumbnailPathFromUrl(option.thumbnailUrl);
        await deleteFileIfExists(thumbnailPath);
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
    const { name, color, order = 0 } = req.body;
    const files = req.files as MulterFiles;

    if (!files || !files.image || files.image.length === 0) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }

    const category = await AvatarCategory.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Avatar category not found' });
      return;
    }

    const imageFile = files.image[0];
    if (!imageFile) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }
    const imageUrl = `/uploads/${imageFile.filename}`;

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
      const thumbnailResult = await ThumbnailGenerator.processUserThumbnail(
        thumbnailFile.path,
        thumbnailFile.filename
      );
      thumbnailUrl = thumbnailResult.thumbnailUrl;
      thumbnailSource = 'user';
    } else {
      // 자동 썸네일 생성
      const thumbnailResult = await ThumbnailGenerator.generateThumbnail(
        imageFile.path,
        imageFile.filename
      );
      thumbnailUrl = thumbnailResult.thumbnailUrl;
      thumbnailSource = 'auto';
    }

    const newOption = {
      name,
      imageUrl,
      thumbnailUrl,
      thumbnailSource,
      color: color || '#000000',
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
    const { name, color, order } = req.body;
    const files = req.files as MulterFiles;

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
    const oldImagePath = option.imageUrl ? getFilePathFromUrl(option.imageUrl) : '';
    const oldThumbnailPath = option.thumbnailUrl ? getThumbnailPathFromUrl(option.thumbnailUrl) : '';

    // 기본 정보 업데이트
    if (name !== undefined) option.name = name;
    if (color !== undefined) option.color = color;
    if (order !== undefined) option.order = parseInt(order);

    // 새 이미지가 있는 경우
    if (files && files.image && files.image.length > 0) {
      const imageFile = files.image[0];
      if (imageFile) {
        // 기존 이미지 파일 삭제
        if (oldImagePath) {
          await deleteFileIfExists(oldImagePath);
        }

        option.imageUrl = `/uploads/${imageFile.filename}`;

        // 기존 썸네일이 자동 생성된 것이면 새로 생성
        if (option.thumbnailSource === 'auto') {
          // 기존 썸네일 삭제
          if (oldThumbnailPath) {
            await deleteFileIfExists(oldThumbnailPath);
          }

          const thumbnailResult = await ThumbnailGenerator.generateThumbnail(
            imageFile.path,
            imageFile.filename
          );
          option.thumbnailUrl = thumbnailResult.thumbnailUrl;
        }
      }
    }

    // 새 썸네일이 있는 경우
    if (files && files.thumbnail && files.thumbnail.length > 0) {
      const thumbnailFile = files.thumbnail[0];
      if (thumbnailFile) {
        // 기존 썸네일 파일 삭제
        if (oldThumbnailPath) {
          await deleteFileIfExists(oldThumbnailPath);
        }

        const thumbnailResult = await ThumbnailGenerator.processUserThumbnail(
          thumbnailFile.path,
          thumbnailFile.filename
        );
        option.thumbnailUrl = thumbnailResult.thumbnailUrl;
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
    
    // 원본 이미지 경로 추출 (uploads/ 제거)
    const imagePath = path.join(process.cwd(), 'uploads', path.basename(option.imageUrl));
    
    // 파일 존재 여부 확인
    try {
      await fs.access(imagePath);
    } catch (error) {
      res.status(404).json({ message: 'Original image file not found' });
      return;
    }
    
    // 기존 썸네일 삭제
    if (option.thumbnailUrl) {
      const oldThumbnailPath = getThumbnailPathFromUrl(option.thumbnailUrl);
      await deleteFileIfExists(oldThumbnailPath);
    }
    
    // 썸네일 재생성
    const thumbnailResult = await ThumbnailGenerator.generateThumbnail(imagePath);
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