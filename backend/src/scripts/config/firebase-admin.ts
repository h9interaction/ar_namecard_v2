import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.join(__dirname, '../../../hninepeople-firebase-adminsdk-fbsvc-cf8551df6d.json'));

export const initializeFirebase = (): admin.app.App => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'hninepeople'
    });
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