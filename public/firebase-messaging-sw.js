// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging.js",
);

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: self.location.origin.includes("localhost")
    ? "YOUR_API_KEY"
    : "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/notification-icon.png",
    badge: "/badge-icon.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

  // Also save to local storage for later processing
  if ("indexedDB" in self) {
    const request = indexedDB.open("notifications", 1);
    request.onsuccess = function (event) {
      const db = event.target.result;
      const objectStore = db
        .transaction(["notifications"], "readwrite")
        .objectStore("notifications");
      objectStore.add({
        title: notificationTitle,
        body: notificationOptions.body,
        receivedAt: Date.now(),
      });
    };
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window or open new one
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
