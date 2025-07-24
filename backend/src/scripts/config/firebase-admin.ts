import * as admin from 'firebase-admin';
import * as path from 'path';

export const initializeFirebase = (): admin.app.App => {
  if (!admin.apps.length) {
    console.log('🔧 Firebase 초기화 시작...');
    console.log('환경 변수 확인:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
    });
    
    // 환경변수 우선, 없으면 파일 기반 fallback
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('✅ 환경 변수로 Firebase 초기화 중...');
      // Private Key 처리 개선
      let privateKey = process.env.FIREBASE_PRIVATE_KEY!;
      
      // 다양한 개행 문자 형식 처리
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Base64로 인코딩된 경우 처리
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
          privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
        } catch (e) {
          console.warn('⚠️ Base64 디코딩 실패, 원본 키 사용');
        }
      }
      
      console.log('🔧 Private Key 형식 확인:', {
        hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
        hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
        length: privateKey.length,
        firstChars: privateKey.substring(0, 50) + '...'
      });
      
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('✅ Firebase 환경 변수 초기화 완료');
      } catch (error) {
        console.error('❌ Firebase 초기화 오류:', error);
        console.error('❌ Firebase 환경변수 확인:', {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
        });
        throw error;
      }
    } else {
      console.log('⚠️ 환경 변수 부족, 서비스 계정 파일로 초기화 시도...');
      // 로컬 개발용 fallback
      try {
        const serviceAccount = require(path.join(__dirname, '../../../hninepeople-firebase-adminsdk-fbsvc-9173f3b0fc.json'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'hninepeople'
        });
        console.log('✅ Firebase 서비스 계정 파일 초기화 완료');
      } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
        console.error('환경 변수를 설정하거나 서비스 계정 파일을 제공해주세요.');
        throw error;
      }
    }
  } else {
    console.log('✅ Firebase 이미 초기화됨');
  }
  return admin.app();
};

export const getFirestore = (): admin.firestore.Firestore => {
  return admin.firestore();
};

export const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    throw new Error(`Failed to verify Firebase ID token: ${error}`);
  }
};

export { admin };