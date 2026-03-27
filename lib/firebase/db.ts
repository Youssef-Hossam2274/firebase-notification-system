import { database } from "./config";
import { ref, push, onValue, Unsubscribe } from "firebase/database";

export interface Notification {
  title: string;
  body: string;
  receivedAt: number;
}

export const saveNotification = async (
  topic: string,
  notification: Notification,
): Promise<void> => {
  try {
    const notificationsRef = ref(database, `notifications/${topic}`);
    await push(notificationsRef, notification);
    console.log(`Notification saved for topic ${topic}`);
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};

export const subscribeToNotifications = (
  topic: string,
  callback: (notifications: (Notification & { id: string })[]) => void,
): Unsubscribe => {
  const notificationsRef = ref(database, `notifications/${topic}`);

  return onValue(notificationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const notificationsList: (Notification & { id: string })[] = [];

      Object.entries(data).forEach(([key, value]) => {
        const notificationData = value as Partial<Notification>;
        notificationsList.push({
          id: key,
          title: notificationData.title || "",
          body: notificationData.body || "",
          receivedAt: notificationData.receivedAt || 0,
        });
      });

      // Sort by newest first
      notificationsList.sort((a, b) => b.receivedAt - a.receivedAt);
      callback(notificationsList);
    } else {
      callback([]);
    }
  });
};

export default {
  saveNotification,
  subscribeToNotifications,
};
