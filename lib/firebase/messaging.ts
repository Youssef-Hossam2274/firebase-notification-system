import { messaging } from "./config";
import { getToken, onMessage } from "firebase/messaging";

export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  if (!messaging) {
    console.log("Messaging not supported");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

export const setupForegroundMessageListener = (
  callback: (title: string, body: string, receivedAt: number) => void,
) => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    const title = payload.notification?.title || "Notification";
    const body = payload.notification?.body || "";
    const receivedAt = Date.now();

    callback(title, body, receivedAt);

    // Show notification in foreground
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/notification-icon.png",
      });
    }
  });
};

export default {
  requestNotificationPermission,
  setupForegroundMessageListener,
};
