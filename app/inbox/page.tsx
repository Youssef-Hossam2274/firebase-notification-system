"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestNotificationPermission,
  setupForegroundMessageListener,
} from "@/lib/firebase/messaging";
import {
  saveNotification,
  subscribeToNotifications,
  Notification as NotificationType,
} from "@/lib/firebase/db";
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [fcmToken, setFcmToken] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const foregroundUnsubscribeRef = useRef<(() => void) | null>(null);
  const autoEnableAttemptedRef = useRef(false);

  const setupForegroundListener = (topicForStorage: string) => {
    if (foregroundUnsubscribeRef.current) {
      return;
    }

    foregroundUnsubscribeRef.current = setupForegroundMessageListener(
      async (title, body, receivedAt) => {
        const notification: NotificationType = { title, body, receivedAt };
        await saveNotification(topicForStorage, notification);
      },
    );
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
          setupForegroundListener(effectiveTopic);
          setWarning(
            "FCM token is created, but topic subscribe is disabled until you add serviceAccountKey.json to the project root.",
          );
          return;
        }
        setError(`Failed to subscribe: ${result.error}`);
        return;
      }

      setSubscribed(true);
      setupForegroundListener(effectiveTopic);
    } catch (err: any) {
      console.error("Enable notifications error:", err);
      setError(err.message || "Failed to enable notifications");
    } finally {
      setEnablingNotifications(false);
    }
  };

  useEffect(() => {
    let unsubscribeDb: (() => void) | undefined;
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
            setupForegroundListener(storedTopic);
          } else if (result.error?.includes("Service account key not found")) {
            setupForegroundListener(storedTopic);
            setWarning(
              "Token found, but topic subscription is not active. Add serviceAccountKey.json to enable topic subscribe/unsubscribe.",
            );
          }
        } else if (!autoEnableAttemptedRef.current) {
          autoEnableAttemptedRef.current = true;
          await enableNotifications(storedTopic);
        }

        unsubscribeDb = subscribeToNotifications(storedTopic, (notificationsData) => {
          setNotifications(notificationsData);
        });

        setLoading(false);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.message || "An error occurred");
        setLoading(false);
      }
    };

    void initializeNotifications();

    return () => {
      if (foregroundUnsubscribeRef.current) {
        foregroundUnsubscribeRef.current();
        foregroundUnsubscribeRef.current = null;
      }
      if (unsubscribeDb) unsubscribeDb();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
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
      setLoggingOut(false);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Inbox</h1>
            <p className="text-slate-600 text-sm mt-1">
              Logged in as: <span className="font-semibold">{username}</span> •
              Topic: <span className="font-semibold">{topic}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {loggingOut && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
            )}
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      {/* Status Indicators */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-4 flex-wrap">
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${subscribed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
          >
            {subscribed ? "✓ Subscribed to topic" : "⏳ Subscribing..."}
          </div>
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${notificationPermission === "granted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
            >
              {enablingNotifications && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
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
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
        {warning && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
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
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800">
                      {notification.title}
                    </h3>
                    <time className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {formatDate(notification.receivedAt)}
                    </time>
                  </div>
                  <p className="text-slate-700">{notification.body}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    ID: {notification.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 font-bold text-blue-900">
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
