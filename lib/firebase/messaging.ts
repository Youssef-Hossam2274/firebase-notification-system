import { getMessagingIfSupported } from "./config";
import { getToken, onMessage } from "firebase/messaging";

export interface NotificationSetupResult {
  token: string | null;
  permission: NotificationPermission | "unsupported";
  error?: string;
}

export const requestNotificationPermission =
  async (): Promise<NotificationSetupResult> => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return { token: null, permission: "unsupported", error: "unsupported" };
    }

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.log("Messaging not supported");
      return {
        token: null,
        permission: Notification.permission,
        error: "messaging-not-supported",
      };
    }

    try {
      if (Notification.permission === "denied") {
        return {
          token: null,
          permission: "denied",
          error: "notification-permission-denied",
        };
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          console.error(
            "FCM token is empty. Check VAPID key and Firebase config.",
          );
          return {
            token: null,
            permission,
            error: "empty-token-check-vapid-and-sw-config",
          };
        }

        return { token, permission };
      } else {
        console.log("Notification permission denied");
        return {
          token: null,
          permission,
          error: "notification-permission-denied",
        };
      }
    } catch (error: any) {
      console.error("Error requesting notification permission:", error);
      return {
        token: null,
        permission: Notification.permission,
        error: error?.message || "token-generation-failed",
      };
    }
  };

export const setupForegroundMessageListener = (
  callback: (title: string, body: string, receivedAt: number) => void,
) => {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return () => {};
  }

  let unsubscribe: () => void = () => {};

  void getMessagingIfSupported().then((messaging) => {
    if (!messaging) return;

    unsubscribe = onMessage(messaging, (payload) => {
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
  });

  return () => unsubscribe();
};

export default {
  requestNotificationPermission,
  setupForegroundMessageListener,
};
