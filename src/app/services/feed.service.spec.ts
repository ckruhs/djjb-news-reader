import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeedService } from './feed.service';
import { Feed } from '../api/feed';
import { firstValueFrom } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('FeedService', () => {
  let service: FeedService;
  let httpMock: HttpTestingController;

  const sampleRss = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<atom:link href="https://www.djjb.de/index.rss" rel="self" type="application/rss+xml" />
<title>Deutscher Jiu Jitsu Bund</title>
<link>https://www.djjb.de</link>
<description>Aktuelles vom DJJB</description>
<language>de</language>
<pubDate>Sun, 22 Apr 2018 15:20:00 +0100</pubDate>
<lastBuildDate>Sun, 22 Apr 2018 15:20:00 +0100</lastBuildDate>
<image>
<url>https://www.djjb.de/images/djjb.png</url>
<title>Deutscher Jiu Jitsu Bund</title>
<link>https://www.djjb.de</link>
</image>
<item>
<title>Lehrgang Bodenkampf</title>
<link>https://www.djjb.de/News/2018/lg24032018.html</link>
<guid>https://www.djjb.de/News/2018/lg24032018.html</guid>
<description>Am 24. März 2018 fand im Dojo des Bujindo Mülheim e.V. der Lehrgang "Bodenkampf" statt.</description>
<category>Lehrgangsberichte</category>
<pubDate>Wed, 4 Apr 2018 18:42:00 +0100</pubDate>
<content:encoded><![CDATA[<img src="https://www.djjb.de/News/2018/images/lg24032018_thumb.jpg" hspace="5" align="left" >Am 24. März 2018 fand im Dojo...]]></content:encoded>
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
    const testUrl = 'test-feed.xml';
    
    const feedPromise = firstValueFrom(service.getFeedContent(testUrl));
    const req = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(sampleRss);

    const feed = await feedPromise;
    expect(feed.rss.version).toBe('2.0');
    expect(feed.rss.channel.title).toBe('Deutscher Jiu Jitsu Bund');
    expect(feed.rss.channel.description).toBe('Aktuelles vom DJJB');
    expect(feed.rss.channel.link).toBe('https://www.djjb.de');
    expect(feed.rss.channel.image.url).toBe('https://www.djjb.de/images/djjb.png');
    
    expect(Array.isArray(feed.rss.channel.item)).toBeTrue();
    const firstItem = feed.rss.channel.item[0];
    expect(firstItem.title).toBe('Lehrgang Bodenkampf');
    expect(firstItem.link).toBe('https://www.djjb.de/News/2018/lg24032018.html');
    expect(firstItem.category).toBe('Lehrgangsberichte');
    expect(firstItem['content:encoded'].includes('lg24032018_thumb.jpg')).toBeTrue();
  });

  it('should handle HTTP errors', async () => {
    const testUrl = 'test-feed.xml';
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
    const testUrl = 'test-feed.xml';
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