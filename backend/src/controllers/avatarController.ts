import { Request, Response } from 'express';
import { UserCustomization } from '../models';
import { validationResult } from 'express-validator';

export const getAvatarByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const avatar = await UserCustomization.findOne({ id: userId });
    
    if (!avatar) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }
    
    res.json(avatar);
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { userId } = req.params;
    const updateData = req.body;
    
    const avatar = await UserCustomization.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true, runValidators: true, upsert: true }
    );
    
    res.json(avatar);
  } catch (error) {
    console.error('Error updating avatar:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
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