import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notification-control',
  templateUrl: './notification-control.component.html',
  styleUrls: ['./notification-control.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class NotificationControlComponent implements OnInit, OnDestroy {
  isSubscribed = false;
  isPushSupported = false;
  loading = false;
  buttonText = 'Enable Notifications';
  
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    // Check if push is supported in this browser
    this.isPushSupported = this.notificationService.isPushNotificationsSupported();
    
    if (this.isPushSupported) {
      // Check if already subscribed
      this.subscription = this.notificationService.getSubscription().subscribe(
        subscription => {
          this.isSubscribed = !!subscription;
          this.updateButtonText();
        }
      );
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleNotifications(): void {
    if (this.loading) return;
    
    this.loading = true;
    
    if (this.isSubscribed) {
      // Unsubscribe
      this.notificationService.unsubscribeFromNotifications().pipe(
        take(1)
      ).subscribe(
        success => {
          this.isSubscribed = !success;
          this.loading = false;
          this.updateButtonText();
        }
      );
    } else {
      // Subscribe
      this.notificationService.subscribeToNotifications().pipe(
        take(1)
      ).subscribe(
        subscription => {
          this.isSubscribed = !!subscription;
          this.loading = false;
          this.updateButtonText();
        }
      );
    }
  }

  private updateButtonText(): void {
    this.buttonText = this.isSubscribed 
      ? 'Notifications Enabled' 
      : 'Enable Notifications';
  }
}
