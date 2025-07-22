import * as admin from 'firebase-admin';
import * as path from 'path';

export const initializeFirebase = (): admin.app.App => {
  if (!admin.apps.length) {
    // 환경변수 우선, 없으면 파일 기반 fallback
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      // 로컬 개발용 fallback
      try {
        const serviceAccount = require(path.join(__dirname, '../../../hninepeople-firebase-adminsdk-fbsvc-cf8551df6d.json'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'hninepeople'
        });
      } catch (error) {
        console.error('Firebase initialization failed. Please set environment variables or provide service account file.');
        throw error;
      }
    }
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