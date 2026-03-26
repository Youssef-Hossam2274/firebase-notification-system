import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firebase Notification System",
  description: "Real-time notification inbox powered by Firebase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50">
        {children}
        <script>
          {`
            // Register service worker for background notifications
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((registration) => {
                  console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                  console.log('Service Worker registration failed:', error);
                });
            }
          `}
        </script>
      </body>
    </html>
  );
}
