// notifications.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, updateDoc, setDoc, doc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { PushNotifications } from '@capacitor/push-notifications';

export interface Notification {
  id?: string;
  userId: string;
  type: string; // 'annulation' | 'info' | 'commande' ...
  message: string;
  commandeId?: string | null;
  redirectTo?: string | null; // 👈 nouveau
  createdAt: any;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  /**
   * Initialise les notifications (à appeler après login)
   */
  async initPush() {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.warn('🚫 Permission refusée');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('✅ Device token:', token.value);
      const user = this.auth.currentUser;
      if (user) {
        await setDoc(
          doc(this.firestore, `users/${user.uid}`),
          { fcmToken: token.value },
          { merge: true }
        );
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('❌ Erreur de registration:', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📩 Push reçu:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👉 Action sur notif:', notification.notification);
    });
  }

  async createNotification(
    userId: string,
    message: string,
    type: string = 'info',
    commandeId?: string,
    redirectTo?: string // 👈 nouveau
  ) {
    const notifRef = collection(this.firestore, 'notifications');
    await addDoc(notifRef, {
      userId,
      type,
      message,
      commandeId: commandeId || null,
      redirectTo: redirectTo || null, // 👈 nouveau
      createdAt: new Date(),
      read: false
    });
  }

  getUserNotifications(userId: string): Observable<Notification[]> {
    const notifRef = collection(this.firestore, 'notifications');
    const q = query(notifRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  getUnreadNotifications(userId: string): Observable<Notification[]> {
    const notifRef = collection(this.firestore, 'notifications');
    const q = query(
      notifRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  async markAsRead(notifId: string) {
    const notifDoc = doc(this.firestore, `notifications/${notifId}`);
    await updateDoc(notifDoc, { read: true });
  }

  async markAllAsRead(userId: string) {
    const sub = this.getUserNotifications(userId).subscribe(list => {
      list.forEach(n => {
        if (!n.read && n.id) {
          this.markAsRead(n.id).catch(err => console.error('Erreur markAsRead', err));
        }
      });
      sub.unsubscribe();
    });
  }
}
