import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { initializeFirebase, verifyIdToken } from '../scripts/config/firebase-admin';

export const verifyFirebaseToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { idToken } = req.body;

    initializeFirebase();

    const decodedToken = await verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const firebaseEmail = decodedToken.email;

    if (!firebaseEmail) {
      res.status(400).json({ error: 'Firebase user email not found' });
      return;
    }

    let user = await User.findOne({ email: firebaseEmail });
    
    if (!user) {
      res.status(404).json({ 
        error: 'User not found in system',
        message: 'Firebase user exists but not registered in AR namecard system',
        firebaseEmail: firebaseEmail
      });
      return;
    }

    const jwtToken = generateToken({
      id: user._id,
      email: user.email,
      arId: user.arId,
      isAdmin: user.isAdmin
    });

    res.json({
      message: 'Firebase authentication successful',
      token: jwtToken,
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
      },
      firebase: {
        uid: firebaseUid,
        email: firebaseEmail
      }
    });
  } catch (error) {
    console.error('Firebase token verification error:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      res.status(401).json({ error: 'Invalid Firebase ID token' });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};