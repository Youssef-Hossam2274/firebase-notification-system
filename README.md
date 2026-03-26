# Firebase Notification System

A real-time notification inbox built with **Next.js 16**, **React 19**, **Firebase Cloud Messaging**, and **Firebase Realtime Database**.

## Features

✅ **Topic-based Subscriptions** - Subscribe to user-specific topics  
✅ **Real-time Inbox** - Live notification updates with Realtime Database  
✅ **Foreground & Background Handling** - Receive notifications in any app state  
✅ **No Authentication Needed** - Username-only login  
✅ **Service Worker Support** - Handle background messages

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with Firebase Admin SDK
- **Database**: Firebase Realtime Database
- **Messaging**: Firebase Cloud Messaging (FCM)

## Project Structure

```
firebase-notification-system/
├── app/
│   ├── api/notifications/
│   │   ├── subscribe/route.ts       # API: Subscribe to topic
│   │   └── unsubscribe/route.ts     # API: Unsubscribe from topic
│   ├── inbox/
│   │   └── page.tsx                 # Inbox screen (main app)
│   ├── page.tsx                     # Login screen
│   ├── layout.tsx                   # Root layout + Service Worker setup
│   └── globals.css                  # Tailwind styles
├── lib/
│   ├── firebase/
│   │   ├── config.ts                # Web SDK initialization
│   │   ├── messaging.ts             # FCM client-side helpers
│   │   ├── db.ts                    # Realtime DB helpers
│   │   └── admin.ts                 # Admin SDK for topic operations
│   └── api/
│       └── client.ts                # API client (fetch wrappers)
├── public/
│   └── firebase-messaging-sw.js     # Service Worker for background messages
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.example
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Firebase project (create at [firebase.google.com](https://firebase.google.com))
- Firebase CLI (optional, for service account key generation)

### 2. Install Dependencies

```bash
npm install
```

### 3. Obtain Firebase Credentials

#### Web Config (Frontend)

1. Go to **Firebase Console** → Your Project → **Settings** (gear icon)
2. Under **Your apps** → **Web apps** → Copy the config object
3. You need:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `databaseURL` (Go to **Realtime Database** → Copy URL)

#### VAPID Key (FCM Public Key)

1. Go to **Cloud Messaging** → **Web configuration**
2. Under **Web Push certificates** → Generate key pair
3. Copy the **Public key**

#### Service Account Key (Backend)

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save as `serviceAccountKey.json` in the project root directory

### 4. Configure Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials:

```env
# Firebase Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_PUBLIC_KEY

# Firebase Admin SDK (Server-side only)
FIREBASE_ADMIN_SDK_KEY_PATH=./serviceAccountKey.json
```

### 5. Setup Realtime Database Rules

Go to **Firebase Console** → **Realtime Database** → **Rules** and set:

```json
{
  "rules": {
    "notifications": {
      "$topic": {
        ".read": true,
        ".write": false,
        "$notification": {
          ".write": true
        }
      }
    }
  }
}
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Testing Workflow

### 1. Login

- Open `http://localhost:3000`
- Enter a username (e.g., `Ashraf`)
- Click **Login**
- Allow notifications when prompted

### 2. Topic Subscription

- After login, you're automatically subscribed to `user_ashraf` (or `user_<your-username>`)
- Status indicator shows ✓ Subscribed to topic

### 3. Send Test Notifications

**Option A: Firebase Console (Recommended)**

1. Go to **Firebase Console** → **Cloud Messaging**
2. Click **Send your first message**
3. Fill in:
   - **Notification title**: "Hello Ashraf"
   - **Notification body**: "This is a test notification"
4. Under **Send to**: Select **Topic**
5. Enter topic name: `user_ashraf` (match your username)
6. Click **Send**

**Option B: Admin SDK (from Backend)**

Run this in Node.js with Firebase Admin initialized:

```javascript
const admin = require("firebase-admin");
admin.messaging().send({
  notification: {
    title: "Test Title",
    body: "Test Body",
  },
  topic: "user_ashraf",
});
```

### 4. View Notifications

- Notification appears in real-time in the inbox
- Each notification shows:
  - Title
  - Body
  - Timestamp (formatted to local time)
  - Notification ID

### 5. Background Messages

- Minimize or close the app
- Send another notification from Firebase Console
- Service Worker receives it and shows a system notification
- Click the notification to return to the inbox

### 6. Logout

- Click **Logout** button
- Unsubscribes from topic automatically
- Returns to login screen

## Database Structure

Notifications are stored at:

```
notifications/
  user_ashraf/
    -notificationId1: {
        "title": "Quiz Reminder",
        "body": "Quiz 2 will be on Thursday",
        "receivedAt": 1712345678
      }
    -notificationId2: {
        "title": "Assignment Due",
        "body": "Assignment 3 is due tomorrow",
        "receivedAt": 1712345679
      }
```

## Deliverables Checklist

For assignment submission, ensure you have screenshots of:

- [ ] **Login Screen** - Username input and login button
- [ ] **Topic Subscription** - Status indicator showing subscribed
- [ ] **Receiving FCM** - Notification sent from Firebase Console
- [ ] **Database Storage** - View in Firebase Console showing notification data
- [ ] **Inbox Display** - List of notifications with title, body, timestamp
- [ ] **Logout** - Unsubscribe confirmation and return to login

## Troubleshooting

### Notifications not showing

1. Check browser console for errors
2. Verify notification permission is granted
3. Check Firebase Console → Cloud Messaging → Logs

### Service Worker not registering

1. Check if file is at `public/firebase-messaging-sw.js`
2. Clear browser cache and restart
3. Check browser DevTools → Application → Service Workers

### "Service account key not found"

1. Ensure `serviceAccountKey.json` is in the project root
2. Check `FIREBASE_ADMIN_SDK_KEY_PATH` in `.env.local`

### Topic subscription fails

1. Verify API routes are running (`/api/notifications/subscribe`)
2. Check Firebase Admin SDK credentials
3. Ensure service account has Cloud Messaging permissions

## API Routes

### POST `/api/notifications/subscribe`

Subscribe FCM token to a topic

**Request:**

```json
{
  "token": "abc123...",
  "topic": "user_ashraf"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully subscribed to topic: user_ashraf"
}
```

### POST `/api/notifications/unsubscribe`

Unsubscribe FCM token from a topic

**Request:**

```json
{
  "token": "abc123...",
  "topic": "user_ashraf"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully unsubscribed from topic: user_ashraf"
}
```

## Notes

- **Usernames are normalized**: Spaces removed, converted to lowercase, special characters filtered
- **Topic naming**: `user_<normalized_username>`
- **No persistent authentication**: Session stored in localStorage (cleared on logout)
- **Foreground notifications**: Shown via Notification API
- **Background notifications**: Handled by Service Worker

## Group Submission

Create a zip file named `ID1_ID2_ID3_ID4_ID5.zip` containing:

1. Source code (all files in this directory)
2. Screenshots of:
   - Login page
   - Inbox after subscription
   - Firebase Console message send
   - Notification in inbox
   - Logout confirmation

```
ID1_ID2_ID3_ID4_ID5.zip
└── firebase-notification-system/
    ├── app/
    ├── lib/
    ├── public/
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── screenshots/
        ├── 01_login.png
        ├── 02_subscribed.png
        ├── 03_send_message.png
        ├── 04_inbox.png
        └── 05_logout.png
```

## Evaluation Criteria (10 Marks)

| Criteria                          | Marks |
| --------------------------------- | ----- |
| Login Screen                      | 1     |
| Topic Subscription/Unsubscription | 2     |
| Receiving FCM Notification        | 2     |
| Storing Data in Realtime Database | 2     |
| Realtime Inbox Display            | 2     |
| Logout Functionality              | 1     |

---

Built with ❤️ using Next.js 16 and Firebase
