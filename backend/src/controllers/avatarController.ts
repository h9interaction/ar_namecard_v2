import { Request, Response } from 'express';
import { UserCustomization } from '../models';
import { validationResult } from 'express-validator';

export const getAvatarByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // 먼저 id로 검색
    let avatar = await UserCustomization.findOne({ id: userId });
    let user = null;
    
    // id로 찾지 못하면 User 테이블에서 arId로 검색해서 실제 id를 찾아 다시 검색
    if (!avatar) {
      const { User } = require('../models');
      user = await User.findOne({ arId: userId });
      if (user) {
        avatar = await UserCustomization.findOne({ id: user._id.toString() });
      }
    } else {
      // avatar가 있으면 해당 사용자 정보도 가져오기
      const { User } = require('../models');
      user = await User.findById(avatar.id);
    }
    
    if (!avatar) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }
    
    // 아바타 옵션들의 상세 정보 가져오기
    const { AvatarCategory, ItemCategory } = require('../models');
    
    // avatarSelections 상세 정보 가져오기
    const avatarSelectionsWithDetails: any = {};
    if (avatar.avatarSelections) {
      for (const [categoryType, optionId] of Object.entries(avatar.avatarSelections)) {
        const category = await AvatarCategory.findOne({ type: categoryType });
        if (category) {
          const option = category.options.find((opt: any) => opt._id.toString() === optionId);
          if (option) {
            avatarSelectionsWithDetails[categoryType] = {
              id: optionId,
              name: option.name,
              imageUrl: option.imageUrl,
              thumbnailUrl: option.thumbnailUrl
            };
          }
        }
      }
    }
    
    // role 상세 정보 가져오기
    let roleDetails = null;
    if (avatar.role) {
      const roleCategory = await ItemCategory.findOne({ type: 'role' });
      if (roleCategory) {
        const roleItem = roleCategory.items.find((item: any) => item._id.toString() === avatar.role);
        if (roleItem) {
          roleDetails = {
            id: avatar.role,
            name: roleItem.name,
            imageUrl: roleItem.imageUrl,
            thumbnailUrl: roleItem.thumbnailUrl
          };
        }
      }
    }
    
    // item1, item2, item3 상세 정보 가져오기
    const itemDetails: any = {};
    const items = ['item1', 'item2', 'item3'];
    
    for (const itemKey of items) {
      if ((avatar as any)[itemKey]) {
        // 모든 아이템 카테고리에서 검색
        const itemCategories = await ItemCategory.find({ type: { $ne: 'role' } });
        let found = false;
        
        for (const category of itemCategories) {
          const item = category.items.find((item: any) => item._id.toString() === (avatar as any)[itemKey]);
          if (item) {
            itemDetails[itemKey] = {
              id: (avatar as any)[itemKey],
              name: item.name,
              imageUrl: item.imageUrl,
              thumbnailUrl: item.thumbnailUrl,
              category: category.name
            };
            found = true;
            break;
          }
        }
        
        if (!found) {
          itemDetails[itemKey] = {
            id: (avatar as any)[itemKey],
            name: 'Unknown',
            imageUrl: null,
            thumbnailUrl: null,
            category: 'Unknown'
          };
        }
      }
    }
    
    // 최종 응답 구성 (사용자 정보 + 아바타 정보 통합)
    const response = {
      id: avatar.id,
      nameEn: user ? user.nameEn : null,
      email: user ? user.email : null,
      nameKr: user ? user.nameKr : null,
      part: user ? user.part : '',
      phone: user ? user.phone : null,
      isNamecardActive: user ? user.isNamecardActive : false,
      arId: user ? user.arId : null,
      isAdmin: user ? user.isAdmin : false,
      avatarSelections: avatarSelectionsWithDetails,
      role: roleDetails,
      item1: itemDetails['item1'] || null,
      item2: itemDetails['item2'] || null,
      item3: itemDetails['item3'] || null,
      avatarImgUrl: avatar.avatarImgUrl,
      message: avatar.message || '',
      createdAt: user ? user.createdAt : avatar.createdAt,
      updatedAt: user ? user.updatedAt : avatar.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }
    
    const { userId } = req.params;
    const updateData = req.body;
    
    console.log('Updating avatar for user:', userId);
    console.log('Update data:', updateData);
    
    const avatar = await UserCustomization.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true, runValidators: true, upsert: true }
    );
    
    res.json(avatar);
  } catch (error) {
    console.error('Error updating avatar:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message, details: error });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const uploadAvatarImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    const avatarImgUrl = `/uploads/${req.file.filename}`;
    
    const avatar = await UserCustomization.findOneAndUpdate(
      { id: userId },
      { avatarImgUrl },
      { new: true, runValidators: true, upsert: true }
    );
    
    res.json({ 
      message: 'Avatar image uploaded successfully',
      avatarImgUrl,
      avatar 
    });
  } catch (error) {
    console.error('Error uploading avatar image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};