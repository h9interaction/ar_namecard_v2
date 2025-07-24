import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { uploadToFirebase } from '../config/firebase-storage';

// 메모리 저장으로 변경
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // Base64로 변환된 이미지 파일의 경우 mimetype이 image/*이면 허용
  const isImageMimeType = file.mimetype.startsWith('image/');

  if ((mimetype && extname) || isImageMimeType) {
    cb(null, true);
  } else {
    console.warn('🚫 파일 타입 거부:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase()
    });
    cb(new Error('Only images and documents are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Firebase 업로드 함수
export const uploadToFirebaseStorage = async (
  file: Express.Multer.File,
  folder: string = 'uploads/'
): Promise<{ url: string; path: string }> => {
  return await uploadToFirebase(file, folder);
};

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);