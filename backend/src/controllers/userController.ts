import { Request, Response } from 'express';
import { User } from '../models';
import { validationResult } from 'express-validator';

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
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
    console.error('Error updating user:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const userData = req.body;
    
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { arId: userData.arId }
      ]
    });
    
    if (existingUser) {
      res.status(409).json({ error: 'User with this email or arId already exists' });
      return;
    }
    
    const user = new User(userData);
    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};