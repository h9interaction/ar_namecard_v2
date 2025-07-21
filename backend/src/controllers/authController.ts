import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { validationResult } from 'express-validator';

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, arId } = req.body;
    
    // 이메일 또는 arId로 사용자 찾기
    const query = email ? { email } : { arId };
    const user = await User.findOne(query);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // JWT 토큰 생성
    const token = generateToken({
      id: user._id,
      email: user.email,
      arId: user.arId,
      isAdmin: user.isAdmin
    });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        nameKr: user.nameKr,
        nameEn: user.nameEn,
        role: user.role,
        part: user.part,
        arId: user.arId,
        isAdmin: user.isAdmin,
        isNamecardActive: user.isNamecardActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTestToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { arId } = req.params;
    
    const user = await User.findOne({ arId });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const token = generateToken({
      id: user._id,
      email: user.email,
      arId: user.arId,
      isAdmin: user.isAdmin
    });
    
    res.json({
      message: 'Test token generated',
      token,
      user: {
        id: user._id,
        email: user.email,
        nameKr: user.nameKr,
        arId: user.arId,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Test token generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};