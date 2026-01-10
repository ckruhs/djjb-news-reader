import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SpinnerComponent } from './spinner/spinner.component';
import { ThumbnailPipe } from './pipes/thumbnail.pipe';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FeedService } from './services/feed.service';
import { of, throwError } from 'rxjs';
import { Feed } from './api/feed';
import { AppComponent } from './app.component';
import { SwPush } from '@angular/service-worker';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NotificationService } from './services/notification.service';

// Mock SwPush dependency with proper observable implementation

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let feedService: FeedService;
  let feedServiceSpy: jasmine.Spy;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockFeed: Feed = {
    rss: {
      version: '2.0',
      channel: {
        title: 'Deutscher Jiu Jitsu Bund',
        description: 'Aktuelles vom DJJB',
        link: 'https://www.djjb.de',
        pubDate: new Date('2018-04-22T15:20:00+0100'),
        image: {
          url: 'https://www.djjb.de/images/djjb.png',
          title: 'Deutscher Jiu Jitsu Bund',
          link: 'https://www.djjb.de'
        },
        item: [
          {
            title: 'Lehrgang Bodenkampf',
            description: 'Am 24. März 2018 fand im Dojo des Bujindo Mülheim e.V. der Lehrgang "Bodenkampf" statt.',
            link: 'https://www.djjb.de/News/2018/lg24032018.html',
            guid: 'https://www.djjb.de/News/2018/lg24032018.html',
            pubDate: new Date('2018-04-04T18:42:00+0100'),
            category: 'Lehrgangsberichte',
            content: '',
            'content:encoded': '<img src="https://www.djjb.de/News/2018/images/lg24032018_thumb.jpg" hspace="5" align="left" >Am 24. März 2018 fand im Dojo...'
          }
        ]
      }
    }
  };

  beforeEach(async () => {
    // Create a mock for NotificationService
    notificationService = jasmine.createSpyObj('NotificationService', [
      'showNewFeedEntryNotification', 
      'getNotificationClicks'
    ]);
    notificationService.getNotificationClicks.and.returnValue(of({ notification: { data: { url: 'https://test.com' } } }));

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        RouterTestingModule, 
        BrowserModule, 
        MatToolbarModule, 
        MatExpansionModule, 
        MatTabsModule, 
        BrowserAnimationsModule, 
        AppComponent, 
        SpinnerComponent, 
        ThumbnailPipe
      ],
      providers: [
        { provide: FeedService, useClass: MockFeedService },
        { provide: NotificationService, useValue: notificationService },
        provideHttpClient(withInterceptorsFromDi()),
        { 
          provide: SwPush, 
          useValue: {
            messages: of({ message: 'Test push message' }),
            subscription: jasmine.createSpy('subscription'),
            requestSubscription: jasmine.createSpy('requestSubscription')
          } 
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this to handle unknown elements
    }).compileComponents();

    feedService = TestBed.inject(FeedService);
    feedServiceSpy = spyOn(feedService, 'getFeedContent').and.returnValue(of(mockFeed));
    // Don't forget to mock other needed methods
    spyOn(feedService, 'startFeedMonitoring').and.stub();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should load feed on init', () => {
    expect(feedServiceSpy).toHaveBeenCalled();
  });

  it('should update feeds array when refreshFeed is called', fakeAsync(() => {
    component.refreshFeed();
    tick(500); // Account for the delay(500) in the component
    
    expect(component.feeds.length).toBe(1);
    expect(component.feeds[0].title).toBe('Lehrgang Bodenkampf');
    expect(component.title).toBe('Aktuelles vom DJJB');
  }));

  it('should handle feed error gracefully', fakeAsync(() => {
    const consoleErrorSpy = spyOn(console, 'error');
    feedServiceSpy.and.returnValue(throwError(() => new Error('Feed error')));
    
    component.refreshFeed();
    tick(500);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.feeds.length).toBe(0);
  }));

  it('should load AddToHomeScreen script in AfterViewInit', () => {
    const rendererSpy = spyOn(component['renderer'], 'createElement').and.callThrough();
    const appendChildSpy = spyOn(component['renderer'], 'appendChild').and.callThrough();
    
    component.ngAfterViewInit();
    
    expect(rendererSpy).toHaveBeenCalledWith('script');
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it('should handle script loading errors gracefully', () => {
    spyOn(component['renderer'], 'createElement').and.throwError('Script error');
    spyOn(console, 'error').and.callThrough();
    
    component.ngAfterViewInit();
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should open link in new window', () => {
    const windowSpy = spyOn(window, 'open');
    const mockFeedItem = mockFeed.rss.channel.item[0];
    
    component.openLinkInBrowser(mockFeedItem);
    
    expect(windowSpy).toHaveBeenCalledWith(mockFeedItem.link, '_blank');
  });
});

// Create a mock FeedService to avoid issues with the real one
class MockFeedService {
  newEntries$ = of([]); // Mock the Observable property

  getFeedContent() {
    return of({});
  }

  startFeedMonitoring() {
    // Do nothing
  }
}
