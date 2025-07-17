import { Request, Response } from 'express';
import { User } from '../models';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: any;
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    
    if (search) {
      query.$or = [
        { nameKr: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { arId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isNamecardActive = isActive === 'true';
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { id } = req.params;
    const { isAdmin, isNamecardActive, role } = req.body;
    
    const updateData: any = {};
    
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }
    
    if (isNamecardActive !== undefined) {
      updateData.isNamecardActive = isNamecardActive;
    }
    
    if (role !== undefined) {
      updateData.role = role;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};