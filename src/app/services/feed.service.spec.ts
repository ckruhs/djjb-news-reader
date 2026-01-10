import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeedService } from './feed.service';
import { Feed } from '../api/feed';
import { firstValueFrom } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('FeedService', () => {
  let service: FeedService;
  let httpMock: HttpTestingController;

  // Ensure the test URL points to the correct mock file
  const testUrl = '/base/src/assets/sample.rss';
  const sampleRss = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<rss version="2.0">
<channel>
<title>Mock Feed</title>
<link>https://mock.feed</link>
<description>Mock Description</description>
<item>
<title>Mock Item</title>
<link>https://mock.item</link>
<description>Mock Item Description</description>
</item>
</channel>
</rss>`;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [FeedService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

    service = TestBed.inject(FeedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and parse RSS feed', async () => {
    const feedPromise = firstValueFrom(service.getFeedContent(testUrl));
    const req = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(sampleRss); // Return the mock data directly

    const feed = await feedPromise;
    expect(feed.rss.version).toBe('2.0');
    expect(feed.rss.channel.title).toBe('Mock Feed');
    expect(feed.rss.channel.description).toBe('Mock Description');
    expect(feed.rss.channel.link).toBe('https://mock.feed');
    
    expect(Array.isArray(feed.rss.channel.item)).toBeTrue();
    const firstItem = feed.rss.channel.item[0];
    expect(firstItem.title).toBe('Mock Item');
    expect(firstItem.link).toBe('https://mock.item');
  });

  it('should handle HTTP errors', async () => {
    let error: any;

    try {
      const feedPromise = firstValueFrom(service.getFeedContent(testUrl));
      const req = httpMock.expectOne(testUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
      await feedPromise;
    } catch (e) {
      error = e;
    }

    expect(error.status).toBe(404);
  });

  it('should handle XML parsing errors', async () => {
    const invalidXml = 'invalid xml content';
    let error: any;

    try {
      const feedPromise = firstValueFrom(service.getFeedContent(testUrl));
      const req = httpMock.expectOne(testUrl);
      req.flush(invalidXml);
      await feedPromise;
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
    expect(error.message).toBe('Invalid XML: Missing XML declaration');
  });
});