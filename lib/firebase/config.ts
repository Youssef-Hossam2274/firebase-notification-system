import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim(),
};

const app = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

export const getMessagingIfSupported = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (messagingInstance) {
    return messagingInstance;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  messagingInstance = getMessaging(app);
  return messagingInstance;
};

export const database = getDatabase(app);

export default app;
