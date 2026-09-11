import * as admin from 'firebase-admin';
import { firebaseConfig } from '../../config/envConfig';

if (!admin.apps.length) {
  try {
    // Convert the private key to the correct format
    const privateKey = firebaseConfig.private_key
      ? firebaseConfig.private_key.split('\\n').join('\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.project_id,
        clientEmail: firebaseConfig.client_email,
        privateKey: privateKey
      } as admin.ServiceAccount)
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export const firebaseAdmin = admin;

export async function sendNotification(
  token: string,
  title: string,
  body: string,
  imageUrl?: string,
) {
  try {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
        imageUrl,
      },
      token,
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
) {
  try {
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    throw error;
  }
} 