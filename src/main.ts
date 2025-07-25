import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideIonicAngular } from '@ionic/angular/standalone';


import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
