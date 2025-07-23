import { initializeFirebase } from '../scripts/config/firebase-admin';

export const getStorage = () => {
  const app = initializeFirebase();
  return app.storage();
};

export const getBucket = () => {
  const storage = getStorage();
  return storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
};

export const uploadToFirebase = async (
  file: Express.Multer.File,
  folder: string = ''
): Promise<{ url: string; path: string }> => {
  const filename = `${folder}${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
  const bucket = getBucket();
  const fileUpload = bucket.file(filename);
  
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        resolve({ url, path: filename });
      } catch (error) {
        reject(error);
      }
    });
    stream.end(file.buffer);
  });
};