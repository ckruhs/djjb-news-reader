import { Component, OnInit, AfterViewInit, ElementRef, ViewEncapsulation, Renderer2, ViewChild, OnDestroy } from '@angular/core';
import { delay } from 'rxjs/operators';
import { FeedService } from './services/feed.service';
import { NotificationService } from './services/notification.service';
import { FeedEntry } from './api/feed-entry';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from './spinner/spinner.component';
import { ThumbnailPipe } from './pipes/thumbnail.pipe';
import { NetworkStatusService } from './services/network-status.service';
import { OfflineStorageService } from './services/offline-storage.service';
import { CacheService } from './services/cache.service';
import { LoggerService } from './services/logger.service';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ck-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css',
              '../assets/addtohomescreen.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonModule,
    SpinnerComponent,
    ThumbnailPipe
  ]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  feedLocation = environment.feedLocation;
  title: string;
  feeds: Array<FeedEntry> = [];
  isLoading = true;
  isOffline = false;
  error: string | null = null;
  lastUpdateTime: string | null = null;
  
  // For displaying debug logs
  debugLogs: {timestamp: number, level: string, message: string}[] = [];
  
  private subscriptions: Subscription[] = [];
  
  @ViewChild('lghost') lghost: ElementRef;
  
  constructor(
    private feedService: FeedService,
    private notificationService: NotificationService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private networkStatus: NetworkStatusService,
    private offlineStorage: OfflineStorageService,
    private cacheService: CacheService,
    private logger: LoggerService
  ) {
    // Get last update time from localStorage if available
    this.lastUpdateTime = localStorage.getItem('lastFeedUpdate');
    
    // Load persisted logs immediately
    this.debugLogs = this.logger.getAllLogs();
    
    // Add startup log
    this.logger.info(`App starting with feed location: ${this.feedLocation}`);
  }

  // Helper method to get the formatted last update time
  getLastUpdateTime(): string {
    return this.lastUpdateTime || 'unknown time';
  }
  
  // Helper method to format log timestamp
  formatLogTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
  
  // Clear persisted logs
  clearLogs(): void {
    this.logger.clearLogs();
    this.debugLogs = [];
  }

  ngOnInit() {
    // Handle network status changes
    this.trackNetworkStatus();
    
    // Initial load based on current network status
    if (this.networkStatus.isOnline()) {
      this.logger.info('App initialized online, loading fresh content');
      this.loadOnlineContent();
    } else {
      this.isOffline = true;
      this.logger.info('App initialized offline, loading cached content');
      this.loadOfflineContent();
    }
    
    // Set up push notification handling
    this.setupNotifications();
  }
  
  /**
   * Track network status for offline/online detection
   */
  private trackNetworkStatus() {
    const networkSub = this.networkStatus.getNetworkStatus().subscribe(isOnline => {
      this.logger.info(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      
      const wasOffline = this.isOffline;
      this.isOffline = !isOnline;
      
      // If we just went offline
      if (this.isOffline && !wasOffline) {
        this.logger.info('Just went offline, ensuring data is available');
      }
      
      // If we just came back online and have no data
      if (!this.isOffline && wasOffline && this.feeds.length === 0) {
        this.logger.info('Back online, loading fresh content');
        this.refreshFeed();
      }
    });
    
    this.subscriptions.push(networkSub);
  }
  
  /**
   * Set up push notification handling
   */
  private setupNotifications() {
    // Only set up if online
    if (!this.networkStatus.isOnline()) return;
    
    // Subscribe to new entries and show notifications for them
    const entriesSub = this.feedService.newEntries$.subscribe(entries => {
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          this.logger.info(`New feed entry found: ${entry.title}`);
          this.notificationService.showNewFeedEntryNotification(
            'DJJB News', // Feed title
            entry.title,
            entry.url
          );
        });
      }
    });
    
    // Handle notification clicks
    const notifSub = this.notificationService.getNotificationClicks().subscribe(event => {
      if (event.notification.data && event.notification.data.url) {
        window.open(event.notification.data.url, '_blank');
      }
    });
    
    this.subscriptions.push(entriesSub, notifSub);
  }
  
  /**
   * Load content and start monitoring when online
   */
  private loadOnlineContent() {
    this.refreshFeed();
    
    // Start monitoring feeds for updates (only when online)
    this.feedService.startFeedMonitoring([this.feedLocation]);
  }
  
  /**
   * Load content from cache when offline
   */
  private loadOfflineContent() {
    this.logger.info('Loading offline content');
    this.isLoading = true;
    this.error = null;
    
    // First try cache via service
    this.feedService.getFeedContent(this.feedLocation)
      .subscribe({
        next: (feed) => {
          this.logger.info(`Loaded feed from cache with ${feed?.rss?.channel?.item?.length || 0} entries`);
          this.isLoading = false;
          if (feed?.rss?.channel) {
            this.title = feed.rss.channel.description || 'DJJB News';
            this.feeds = feed.rss.channel.item || [];
            this.error = null;
          } else {
            this.logger.error('Could not load valid feed content from cache');
            this.error = "Could not load feed content from cache";
          }
          
          // Refresh debug logs
          this.debugLogs = this.logger.getAllLogs();
        },
        error: (err) => {
          this.logger.error(`Error loading cached feed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          this.isLoading = false;
          this.error = "No cached content available. Please connect to the internet.";
          this.feeds = [];
          
          // Refresh debug logs
          this.debugLogs = this.logger.getAllLogs();
        }
      });
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  ngAfterViewInit() {
    try {
      this.loadAddToHomeScreen();
      if (this.networkStatus.isOnline()) {
        this.loadLehrgangsanmeldung();
      }
    } catch (error) {
      this.logger.error(`Error loading scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private loadAddToHomeScreen() {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.text = 'if (window.addToHomescreen) { addToHomescreen(); }';
    this.renderer.appendChild(this.elementRef.nativeElement, script);
  }

  private loadLehrgangsanmeldung() {
    if (this.lghost) {
      const script = this.renderer.createElement('script');
      script.type = 'module';
      script.src = 'https://djjb.foehst.net/lehrgangsanmeldung.js';
      script.onload = () => {
        const lglist = this.renderer.createElement('x-lehrgangsanmeldung');
        this.renderer.setStyle(lglist, 'font-size', '.8em');
        this.renderer.appendChild(this.lghost.nativeElement, lglist);
      };
      this.renderer.appendChild(this.elementRef.nativeElement, script);
    }
  }

  refreshFeed() {
    // Check if offline before attempting to refresh
    if (!this.networkStatus.isOnline()) {
      this.logger.info('Offline - loading from cache instead of refreshing');
      this.loadOfflineContent();
      return;
    }
    
    this.feeds = [];
    this.isLoading = true;
    this.error = null;
    
    this.feedService.getFeedContent(this.feedLocation)
      .pipe(delay(500))
      .subscribe({
        next: (feed) => {
          this.isLoading = false;
          if (feed?.rss?.channel) {
            this.title = feed.rss.channel.description || 'DJJB News';
            this.feeds = feed.rss.channel.item || [];
            // Store last update time for user feedback
            this.lastUpdateTime = new Date().toISOString();
            localStorage.setItem('lastFeedUpdate', this.lastUpdateTime);
            this.logger.info(`Successfully refreshed feed with ${this.feeds.length} entries`);
          } else {
            this.error = "Invalid feed format received";
            this.logger.error('Invalid feed format received');
          }
          
          // Refresh debug logs
          this.debugLogs = this.logger.getAllLogs();
        },
        error: (error) => {
          this.isLoading = false;
          this.logger.error(`Error loading feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // If we're online, show network error
          if (this.networkStatus.isOnline()) {
            this.error = "Couldn't load feed data. Please try again later.";
          } else {
            // If offline, try to load from cache
            this.loadOfflineContent();
          }
          
          // Refresh debug logs
          this.debugLogs = this.logger.getAllLogs();
        }
      });
  }

  openLinkInBrowser(feed: any) {
    window.open(feed.link, '_blank');
  }
}
