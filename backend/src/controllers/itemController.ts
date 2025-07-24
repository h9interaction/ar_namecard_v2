import { Request, Response } from 'express';
import { ItemCategory, AvatarCategory } from '../models';

export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    
    let query = {};
    
    if (type) {
      query = { type };
    }
    
    const items = await ItemCategory.find(query).sort({ order: 1, createdAt: -1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const item = await ItemCategory.findById(id);
    
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvatarCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    
    let query = {};
    
    if (type) {
      query = { type };
    }
    
    const categories = await AvatarCategory.find(query).sort({ order: 1, createdAt: -1 });
    
    // 헤어 카테고리의 경우 리소스 이미지 정보 로깅
    categories.forEach(category => {
      if (category.type === 'hair') {
        console.log(`🔍 헤어 카테고리 조회: ${category.name}`);
        category.options.forEach((option, optionIndex) => {
          console.log(`  옵션 ${optionIndex}: ${option.name}`);
          if (option.color && option.color.length > 0) {
            option.color.forEach((colorOption, colorIndex) => {
              console.log(`    컬러 ${colorIndex}: ${colorOption.colorName}`);
              console.log(`      imageUrl: ${colorOption.imageUrl}`);
              if (colorOption.resourceImages) {
                console.log(`      resourceImages:`, {
                  hairMiddleImageUrl: colorOption.resourceImages.hairMiddleImageUrl,
                  hairBackImageUrl: colorOption.resourceImages.hairBackImageUrl
                });
              } else {
                console.log(`      resourceImages: 없음`);
              }
            });
          }
        });
      }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching avatar categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvatarCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await AvatarCategory.findById(id);
    
    if (!category) {
      res.status(404).json({ error: 'Avatar category not found' });
      return;
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching avatar category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};