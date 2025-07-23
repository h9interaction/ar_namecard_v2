import { initializeFirebase } from '../scripts/config/firebase-admin';

export const getStorage = () => {
  try {
    const app = initializeFirebase();
    return app.storage();
  } catch (error) {
    console.error('❌ Firebase Storage 초기화 오류:', error);
    throw new Error('Firebase Storage 초기화 실패');
  }
};

export const getBucket = () => {
  try {
    const storage = getStorage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      throw new Error('FIREBASE_STORAGE_BUCKET 환경 변수가 설정되지 않았습니다');
    }
    
    console.log('🔧 Firebase Storage 버킷:', bucketName);
    return storage.bucket(bucketName);
  } catch (error) {
    console.error('❌ Firebase Bucket 초기화 오류:', error);
    throw error;
  }
};

export const uploadToFirebase = async (
  file: Express.Multer.File,
  folder: string = ''
): Promise<{ url: string; path: string }> => {
  try {
    console.log('📤 Firebase 업로드 시작:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      folder: folder
    });

    const filename = `${folder}${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    const bucket = getBucket();
    const fileUpload = bucket.file(filename);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('❌ Firebase 스트림 오류:', error);
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          console.log('🔄 파일 업로드 완료, 공개 설정 중...');
          await fileUpload.makePublic();
          const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
          console.log('✅ Firebase 업로드 성공:', url);
          resolve({ url, path: filename });
        } catch (error) {
          console.error('❌ 파일 공개 설정 오류:', error);
          reject(error);
        }
      });
      
      console.log('🔄 파일 스트림 시작...');
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('❌ Firebase 업로드 오류:', error);
    throw error;
  }
};