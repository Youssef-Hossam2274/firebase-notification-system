import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "",
  };

  const swSource = `
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};

    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload.notification?.title || "Notification";
      const notificationOptions = {
        body: payload.notification?.body || "",
        icon: "/notification-icon.png",
        badge: "/badge-icon.png",
        data: payload.data || {},
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener("notificationclick", (event) => {
      event.notification.close();
      event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === "/" || client.url.includes("/inbox")) {
              return client.focus();
            }
          }
          return clients.openWindow("/inbox");
        }),
      );
    });
  `;

  return new NextResponse(swSource, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Service-Worker-Allowed": "/",
    },
  });
}
