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
      folder: folder,
      hasBuffer: !!file.buffer,
      bufferSize: file.buffer?.length
    });

    // 환경변수 확인
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    console.log('🔧 Firebase 설정 확인:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      hasStorageBucket: !!storageBucket,
      projectId: projectId,
      storageBucket: storageBucket
    });

    if (!file.buffer) {
      throw new Error('파일 버퍼가 없습니다');
    }

    const filename = `${folder}${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    const bucket = getBucket();
    
    console.log('🔧 버킷 정보:', bucket.name);
    
    const fileUpload = bucket.file(filename);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false // 작은 파일의 경우 resumable 업로드 비활성화
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('❌ Firebase 스트림 오류:', error);
        console.error('❌ 스트림 오류 상세:', {
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        });
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
    console.error('❌ 업로드 오류 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      code: (error as any).code
    });
    throw error;
  }
};