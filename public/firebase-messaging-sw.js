// v2.6.27.11: Firebase Cloud Messaging service worker.
// Registered automatically by the Firebase Messaging Web SDK when
// the app calls getToken(). Sits alongside the existing /sw.js
// (which handles asset caching); the two don't conflict because
// each registers at a different scope URL.
//
// Receive-side only. Send-side is parked — Cloud Functions design
// discussion is a CLAUDE.md no-go zone until the user OKs it. So
// this SW just sits dormant until a sender pushes; the only way to
// verify it works is via Firebase Console → Cloud Messaging → Send
// test message. Background message handler shows the OS notification;
// the notificationclick handler focuses an existing app tab if open,
// otherwise opens a new one at the payload's `url` data field.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Same config as src/firebase.js — the web client API key is intentionally
// public, with access control enforced via database.rules.json. See
// CLAUDE.md "no-go zones" — don't extract this to env vars.
firebase.initializeApp({
  apiKey: "AIzaSyDKmOEL0eT0YL47wBz24RYChyWIPUv00OM",
  authDomain: "fantasy-reality-d7e16.firebaseapp.com",
  databaseURL: "https://fantasy-reality-d7e16-default-rtdb.firebaseio.com",
  projectId: "fantasy-reality-d7e16",
  storageBucket: "fantasy-reality-d7e16.firebasestorage.app",
  messagingSenderId: "897295939521",
  appId: "1:897295939521:web:c1a6fa044e2dd86745e140",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const data = payload.data || {};
  const title = n.title || 'Fantasy Reality TV';
  const body = n.body || '';
  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'frtv-push',
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Payload can pass `data.url` to deep-link into a specific
  // league / tab; default to the home screen.
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((wins) => {
        for (const w of wins) {
          // If any FRTV tab is already open, focus it instead of
          // opening a new one. We don't filter by exact URL because
          // SPA routing may have updated the location after load.
          if (w.url && w.url.indexOf(self.location.origin) === 0 && 'focus' in w) {
            return w.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return null;
      })
  );
});
