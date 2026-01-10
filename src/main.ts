import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    // Register service workers only in production
    if (environment.production && 'serviceWorker' in navigator) {
      // First, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister().then(success => {
            console.log('Service worker unregistered:', success);
          });
        }
        
        // Then register our custom service worker
        navigator.serviceWorker.register('/sw-custom.js')
          .then(reg => {
            console.log('Custom service worker registered');
            
            // Also register the Angular service worker for other assets
            navigator.serviceWorker.register('/ngsw-worker.js')
              .then(ngswReg => {
                console.log('Angular service worker registered');
              })
              .catch(err => {
                console.error('Error registering Angular service worker:', err);
              });
          })
          .catch(err => {
            console.error('Error registering custom service worker:', err);
          });
      });
    }
  })
  .catch(err => console.error(err));
