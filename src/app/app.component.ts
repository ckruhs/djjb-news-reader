import { Component, OnInit, AfterViewInit, ElementRef, ViewEncapsulation, Renderer2, ViewChild, OnDestroy } from '@angular/core';
import { delay } from 'rxjs/operators';
import { FeedService } from './services/feed.service';
import { NotificationService } from './services/notification.service';
import { FeedEntry } from './api/feed-entry';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ck-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css',
              '../assets/addtohomescreen.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  feedLocation = environment.feedLocation + '?v=' + Math.random();  // prevent browser caching
  title: string;
  feeds: Array<FeedEntry> = [];
  private newEntriesSubscription: Subscription;
  
  @ViewChild('lghost') lghost: ElementRef;
  constructor(
    private feedService: FeedService,
    private notificationService: NotificationService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.refreshFeed();
    
    // Start monitoring for new feed entries
    this.feedService.startFeedMonitoring([this.feedLocation]);
    
    // Subscribe to new entries and show notifications for them
    this.newEntriesSubscription = this.feedService.newEntries$.subscribe(entries => {
      if (entries && entries.length > 0) {
        // Show notification for each new entry
        entries.forEach(entry => {
          this.notificationService.showNewFeedEntryNotification(
            'DJJB News', // Feed title
            entry.title,
            entry.url
          );
        });
      }
    });
    
    // Handle notification clicks
    this.notificationService.getNotificationClicks().subscribe(event => {
      if (event.notification.data && event.notification.data.url) {
        window.open(event.notification.data.url, '_blank');
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.newEntriesSubscription) {
      this.newEntriesSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    try {
      this.loadAddToHomeScreen();
      this.loadLehrgangsanmeldung();
    } catch (error) {
      console.error('Error loading scripts:', error);
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
    this.feeds = [];
    this.feedService.getFeedContent(this.feedLocation)
      .pipe(delay(500))
      .subscribe({
        next: (feed: any) => {
          if (feed?.rss?.channel) {
            this.title = feed.rss.channel.description;
            this.feeds = feed.rss.channel.item;
          }
        },
        error: (error) => {
          console.error('Error loading feed:', error);
        }
      });
  }

  openLinkInBrowser(feed: any) {
    window.open(feed.link, '_blank');
  }
}
