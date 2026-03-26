import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

let initialized = false;

export const initializeAdmin = () => {
  if (initialized) {
    return admin.app();
  }

  try {
    const keyPath =
      process.env.FIREBASE_ADMIN_SDK_KEY_PATH || "./serviceAccountKey.json";
    const absolutePath = path.resolve(keyPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Service account key not found at ${absolutePath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    initialized = true;
    console.log("Firebase Admin SDK initialized");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }

  return admin.app();
};

export const subscribeToTopic = async (
  tokens: string[],
  topic: string,
): Promise<void> => {
  try {
    const app = initializeAdmin();
    const messaging = admin.messaging(app);
    await messaging.subscribeToTopic(tokens, topic);
    console.log(`Subscribed ${tokens.length} token(s) to topic ${topic}`);
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    throw error;
  }
};

export const unsubscribeFromTopic = async (
  tokens: string[],
  topic: string,
): Promise<void> => {
  try {
    const app = initializeAdmin();
    const messaging = admin.messaging(app);
    await messaging.unsubscribeFromTopic(tokens, topic);
    console.log(`Unsubscribed ${tokens.length} token(s) from topic ${topic}`);
  } catch (error) {
    console.error("Error unsubscribing from topic:", error);
    throw error;
  }
};

export default {
  initializeAdmin,
  subscribeToTopic,
  unsubscribeFromTopic,
};
