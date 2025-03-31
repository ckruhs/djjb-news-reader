import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Your VAPID public key - in a real app, this would be from your environment variables
  readonly VAPID_PUBLIC_KEY = 'BJ5IxJBWdeqFDJTvrZ4wNRu7UY2XigDXjgiUBYEYVXDudxhEs0ReOJRBcBHsPYgZ5dyV8VjyqzbQKS8V7bUAglk';
  
  // API endpoint for registering push subscriptions (would need to be implemented on your backend)
  private pushSubscriptionEndpoint = environment.apiUrl ? `${environment.apiUrl}/push-subscription` : '';
  
  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) { 
    // Listen for push messages
    this.swPush.messages.subscribe(message => {
      console.log('Received push message', message);
      this.showLocalNotification(message);
    });
  }

  // Check if push notifications are supported by the browser
  isPushNotificationsSupported(): boolean {
    return this.swPush.isEnabled;
  }

  // Request user permission and subscribe to push notifications
  subscribeToNotifications(): Observable<PushSubscription | null> {
    if (!this.isPushNotificationsSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return of(null);
    }
    
    return from(
      this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      })
    ).pipe(
      tap(sub => this.sendSubscriptionToServer(sub)),
      catchError(err => {
        console.error('Could not subscribe to notifications', err);
        return of(null);
      })
    );
  }

  // Unsubscribe from push notifications
  unsubscribeFromNotifications(): Observable<boolean> {
    if (!this.swPush.subscription) {
      return of(false);
    }
    
    return from(this.swPush.unsubscribe()).pipe(
      tap(() => this.removeSubscriptionFromServer()),
      map(() => true),
      catchError(err => {
        console.error('Could not unsubscribe from notifications', err);
        return of(false);
      })
    );
  }

  // Get the current subscription if any
  getSubscription(): Observable<PushSubscription | null> {
    return this.swPush.subscription;
  }

  // Listen for push notification clicks
  getNotificationClicks(): Observable<any> {
    return this.swPush.notificationClicks;
  }

  // Show a notification for a new feed entry without going through push
  // This is useful for showing notifications when the app is in the foreground
  showNewFeedEntryNotification(feedTitle: string, entryTitle: string, entryUrl: string): void {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    if (Notification.permission === 'granted') {
      this.createNotification(feedTitle, entryTitle, entryUrl);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(feedTitle, entryTitle, entryUrl);
        }
      });
    }
  }

  // Register subscription with backend server
  private sendSubscriptionToServer(subscription: PushSubscription): void {
    if (!this.pushSubscriptionEndpoint) {
      console.warn('No push subscription endpoint configured');
      return;
    }
    
    this.http.post(this.pushSubscriptionEndpoint, { subscription })
      .pipe(
        catchError(error => {
          console.error('Error sending subscription to server', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // Remove subscription from backend server
  private removeSubscriptionFromServer(): void {
    if (!this.pushSubscriptionEndpoint) {
      return;
    }
    
    this.http.delete(`${this.pushSubscriptionEndpoint}`)
      .pipe(
        catchError(error => {
          console.error('Error removing subscription from server', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // Create and show a notification
  private createNotification(feedTitle: string, entryTitle: string, entryUrl: string): void {
    const notificationOptions = {
      body: `New article in ${feedTitle}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      data: {
        url: entryUrl
      }
    };

    const notification = new Notification(entryTitle, notificationOptions);
    
    notification.onclick = () => {
      window.focus();
      window.open(entryUrl, '_blank');
      notification.close();
    };
  }

  // Show a notification from a push message
  private showLocalNotification(data: any): void {
    const title = data.title || 'New Feed Entry';
    const options = {
      body: data.body || 'There is new content available',
      icon: data.icon || '/assets/icons/icon-192x192.png',
      badge: data.badge || '/assets/icons/icon-72x72.png',
      data: data
    };

    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    });
  }
}
