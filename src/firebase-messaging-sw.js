// firebase-messaging-sw.js
// ⚡ Ce fichier est obligatoire pour recevoir des notifs en background

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBLeQ8kLpUevOq613VydcN_lkgiEwxMHJ0",
  authDomain: "coursy-app-dd73d.firebaseapp.com",
  projectId: "coursy-app-dd73d",
  storageBucket: "coursy-app-dd73d.firebasestorage.app",
  messagingSenderId: "950707037847",
  appId: "1:950707037847:web:eb5f4d2e29b5a02a91ebd2",
  measurementId: "G-VCBEV9YDDF"
});

// Initialisation Messaging (compat obligatoire dans un SW)
const messaging = firebase.messaging();

// Gestion des messages reçus en background
messaging.onBackgroundMessage((payload) => {
  console.log("📩 [Service Worker] Message reçu en background :", payload);

  const notificationTitle = payload.notification?.title || "Nouvelle notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/assets/icon/icone-coursy-re.png" // adapte avec ton app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
