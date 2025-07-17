import { FirebaseUser } from '../types/firebase-user';
import { IUser } from '../../models';

export class DataMapper {
  public static mapFirebaseUserToUser(firebaseUser: FirebaseUser, arId: string): Partial<IUser> {
    return {
      email: firebaseUser.email,
      nameEn: firebaseUser.englishName,
      nameKr: firebaseUser.koreanName,
      part: firebaseUser.organization,
      role: firebaseUser.role,
      phone: '010-0000-0000',
      arId: arId,
      isNamecardActive: false,
      isAdmin: false
    };
  }

  public static mapFirebaseUserToCustomization(firebaseUser: FirebaseUser, userId: string): any {
    return {
      id: userId, // MongoDB ObjectId will be set
      avatarSelections: new Map(),
      role: firebaseUser.role,
      avatarImgUrl: null // Firebase imageUrl 무시, null로 설정
    };
  }

  public static validateFirebaseUser(data: any): FirebaseUser | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const requiredFields = ['email', 'englishName', 'koreanName', 'organization', 'role'];
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string') {
        console.warn(`Missing or invalid field: ${field}`);
        return null;
      }
    }

    return {
      email: data.email,
      englishName: data.englishName,
      koreanName: data.koreanName,
      organization: data.organization,
      position: data.position || '',
      role: data.role,
      imageUrl: data.imageUrl || ''
    };
  }
}