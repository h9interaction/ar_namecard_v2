import { Request, Response } from 'express';
import { UserCustomization, AvatarCategory } from '../models';
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
      for (const [categoryType, selection] of Object.entries(avatar.avatarSelections)) {
        const category = await AvatarCategory.findOne({ type: categoryType });
        if (category) {
          // 새로운 데이터 구조와 기존 데이터 구조 모두 지원
          const optionId = typeof selection === 'object' && selection !== null ? 
            (selection as any).optionId : selection;
          const colorIndex = typeof selection === 'object' && selection !== null ? 
            ((selection as any).colorIndex || 0) : 0;
            
          console.log(`🔍 아바타 조회 - ${categoryType}:`, {
            selection,
            extractedOptionId: optionId,
            colorIndex
          });
            
          const option = category.options.find((opt: any) => opt._id.toString() === optionId);
          if (option) {
            // 기존 데이터 호환성을 위한 마이그레이션 로직
            let colorOptions = option.color;
            
            // 기존 구조(단일 color string)를 새 구조로 변환
            if (typeof option.color === 'string' && option.imageUrl) {
              colorOptions = [{
                colorName: option.color === '#000000' ? 'Black' : option.color === '#ffffff' ? 'White' : option.color,
                imageUrl: option.imageUrl
              }];
            }
            // color가 배열이 아니고 imageUrl이 있는 경우 (null, undefined 등)
            else if (!Array.isArray(option.color) && option.imageUrl) {
              colorOptions = [{
                colorName: 'Default',
                imageUrl: option.imageUrl
              }];
            }
            
            avatarSelectionsWithDetails[categoryType] = {
              id: optionId,
              optionId: optionId,      // 새로운 구조 지원
              colorIndex: colorIndex,   // 컬러 인덱스 추가
              name: option.name,
              imageUrl: option.imageUrl,
              thumbnailUrl: option.thumbnailUrl,
              color: colorOptions
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
    console.log('📤 아바타 이미지 업로드 시작:', {
      hasFile: !!req.file,
      userId: req.body?.userId,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype,
      hasBuffer: !!req.file?.buffer,
      hasPath: !!req.file?.path,
      filePath: req.file?.path,
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname
    });

    if (!req.file) {
      console.error('❌ 파일이 없음');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      console.error('❌ 사용자 ID가 없음');
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    if (!req.file.buffer) {
      console.error('❌ 파일 버퍼가 없음');
      res.status(400).json({ error: 'File buffer is missing' });
      return;
    }
    
    // Firebase Storage를 사용하여 이미지 업로드
    const { uploadToFirebase } = await import('../config/firebase-storage');
    
    console.log('🔄 Firebase Storage 업로드 시작...');
    const uploadResult = await uploadToFirebase(req.file, 'uploads/avatars/');
    const avatarImgUrl = uploadResult.url;
    console.log('✅ Firebase Storage 업로드 완료:', avatarImgUrl);
    
    console.log('🔄 데이터베이스 업데이트 시작...');
    const avatar = await UserCustomization.findOneAndUpdate(
      { id: userId },
      { avatarImgUrl },
      { new: true, runValidators: true, upsert: true }
    );
    console.log('✅ 데이터베이스 업데이트 완료');
    
    res.json({ 
      message: 'Avatar image uploaded successfully',
      avatarImgUrl,
      avatar 
    });
  } catch (error) {
    console.error('❌ 아바타 이미지 업로드 오류:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// 일반 사용자용 아바타 카테고리 조회 (마이그레이션 로직 포함)
export const getAvatarCategories = async (req: Request, res: Response): Promise<void> => {
  try {
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
          
          return option;
        });
      }
      return categoryObj;
    });
    
    res.json({ categories: migratedCategories, total: migratedCategories.length });
  } catch (error) {
    console.error('Error fetching avatar categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};