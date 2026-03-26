"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestNotificationPermission,
  setupForegroundMessageListener,
} from "@/lib/firebase/messaging";
// Database is temporarily disabled until Realtime Database setup is completed.
// import {
//   saveNotification,
//   subscribeToNotifications,
//   Notification as NotificationType,
// } from "@/lib/firebase/db";
import { subscribe, unsubscribe } from "@/lib/api/client";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
}

export default function InboxPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [topic, setTopic] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [fcmToken, setFcmToken] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [foregroundUnsubscribe, setForegroundUnsubscribe] = useState<
    (() => void) | null
  >(null);
  const autoEnableAttemptedRef = useRef(false);

  const setupForegroundListener = () => {
    if (foregroundUnsubscribe) {
      return;
    }

    const unsubscribeForeground = setupForegroundMessageListener(
      async (title, body, receivedAt) => {
        // Database write intentionally disabled for now.
        // const notification: NotificationType = { title, body, receivedAt };
        // await saveNotification(storedTopic, notification);

        // Keep notifications visible in the UI while DB is disabled.
        setNotifications((prev) => [
          {
            id: `${receivedAt}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            body,
            receivedAt,
          },
          ...prev,
        ]);
      },
    );

    setForegroundUnsubscribe(() => unsubscribeForeground);
  };

  const enableNotifications = async (topicOverride?: string) => {
    try {
      setEnablingNotifications(true);
      setError("");
      setWarning("");

      const effectiveTopic = topicOverride ?? topic;
      if (!effectiveTopic) {
        setError("Topic is missing. Please login again.");
        return;
      }

      const setupResult = await requestNotificationPermission();
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationPermission(Notification.permission);
      }

      if (!setupResult.token) {
        if (setupResult.error === "notification-permission-denied") {
          setError(
            "Notifications are blocked by the browser. Allow notifications for localhost:3000 in site settings, then try again.",
          );
          return;
        }

        setError(
          `Failed to create FCM token: ${setupResult.error || "unknown-error"}`,
        );
        return;
      }

      const token = setupResult.token;
      setFcmToken(token);
      localStorage.setItem("fcmToken", token);

      const result = await subscribe(token, effectiveTopic);
      if (!result.success) {
        if (result.error?.includes("Service account key not found")) {
          setupForegroundListener();
          setWarning(
            "FCM token is created, but topic subscribe is disabled until you add serviceAccountKey.json to the project root.",
          );
          return;
        }
        setError(`Failed to subscribe: ${result.error}`);
        return;
      }

      setSubscribed(true);
      setupForegroundListener();
    } catch (err: any) {
      console.error("Enable notifications error:", err);
      setError(err.message || "Failed to enable notifications");
    } finally {
      setEnablingNotifications(false);
    }
  };

  useEffect(() => {
    // DB listener intentionally disabled for now.
    // let unsubscribeDb: (() => void) | undefined;
    const initializeNotifications = async () => {
      try {
        // Check session
        const storedUsername = localStorage.getItem("username");
        const storedTopic = localStorage.getItem("topic");

        if (!storedUsername || !storedTopic) {
          router.push("/");
          return;
        }

        setUsername(storedUsername);
        setTopic(storedTopic);

        if (typeof window !== "undefined" && "Notification" in window) {
          setNotificationPermission(Notification.permission);
        }

        const existingToken = localStorage.getItem("fcmToken");
        if (existingToken && Notification.permission === "granted") {
          setFcmToken(existingToken);
          const result = await subscribe(existingToken, storedTopic);
          if (result.success) {
            setSubscribed(true);
            setupForegroundListener();
          } else if (result.error?.includes("Service account key not found")) {
            setupForegroundListener();
            setWarning(
              "Token found, but topic subscription is not active. Add serviceAccountKey.json to enable topic subscribe/unsubscribe.",
            );
          }
        } else if (!autoEnableAttemptedRef.current) {
          autoEnableAttemptedRef.current = true;
          await enableNotifications(storedTopic);
        }

        // Realtime database subscription intentionally disabled for now.
        // unsubscribeDb = subscribeToNotifications(
        //   storedTopic,
        //   (notificationsData) => {
        //     setNotifications(notificationsData);
        //   },
        // );

        setLoading(false);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.message || "An error occurred");
        setLoading(false);
      }
    };

    void initializeNotifications();

    return () => {
      if (foregroundUnsubscribe) foregroundUnsubscribe();
      // if (unsubscribeDb) unsubscribeDb();
    };
  }, [router, foregroundUnsubscribe]);

  const handleLogout = async () => {
    try {
      // Unsubscribe from topic
      if (fcmToken && topic) {
        const result = await unsubscribe(fcmToken, topic);
        if (!result.success) {
          console.error("Unsubscribe failed:", result.error);
        }
      }

      // Clear session
      localStorage.removeItem("username");
      localStorage.removeItem("fcmToken");
      localStorage.removeItem("topic");

      // Redirect to login
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to logout");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Setting up notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🔔 Inbox</h1>
            <p className="text-gray-600 text-sm mt-1">
              Logged in as: <span className="font-semibold">{username}</span> •
              Topic: <span className="font-semibold">{topic}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Status Indicators */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-4 flex-wrap">
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${subscribed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
          >
            {subscribed ? "✓ Subscribed to topic" : "⏳ Subscribing..."}
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${notificationPermission === "granted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
          >
            {notificationPermission === "granted"
              ? "✓ Notifications enabled"
              : "⚠ Notifications disabled"}
          </div>
        </div>
        {!subscribed && (
          <div className="mt-4">
            <button
              onClick={() => void enableNotifications()}
              disabled={enablingNotifications}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {enablingNotifications
                ? "Enabling notifications..."
                : "Enable Notifications"}
            </button>
          </div>
        )}
        {notificationPermission === "denied" && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2">
            Notifications are blocked for this site. Open browser site settings,
            allow notifications for localhost, then click "Enable Notifications"
            again.
          </p>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {warning && (
          <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg mb-6">
            {warning}
          </div>
        )}

        {/* Notifications List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Notifications ({notifications.length})
          </h2>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p className="text-lg">No notifications yet</p>
              <p className="text-sm mt-2">
                Send a message to topic{" "}
                <span className="font-mono bg-gray-100 px-2 py-1">{topic}</span>{" "}
                from Firebase Console
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {notification.title}
                    </h3>
                    <time className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(notification.receivedAt)}
                    </time>
                  </div>
                  <p className="text-gray-700">{notification.body}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    ID: {notification.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">
            📝 How to send test notifications:
          </h3>
          <ol className="list-decimal list-inside text-blue-900 text-sm space-y-2">
            <li>Go to Firebase Console → Cloud Messaging</li>
            <li>Click "Send your first message"</li>
            <li>Enter notification title and body</li>
            <li>Under "Send to", select "Topic"</li>
            <li>
              Enter topic name:{" "}
              <span className="font-mono bg-white px-2 py-1">{topic}</span>
            </li>
            <li>Click "Send"</li>
            <li>Notification should appear here in real-time</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
