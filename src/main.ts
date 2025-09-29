import { provideIonicAngular } from '@ionic/angular/standalone';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    ...appConfig.providers,
    provideIonicAngular() 
  ]
}).catch(err => console.error(err));

// ✅ Enregistrement du Service Worker pour FCM
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('firebase-messaging-sw.js')
    .then(reg => console.log("✅ Service Worker enregistré :", reg))
    .catch(err => console.error("❌ Erreur SW :", err));
}
