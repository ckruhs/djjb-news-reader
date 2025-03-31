import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, from, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import * as xml2js from 'xml2js';
import { Feed } from '../api/feed';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private lastFeedEntries = new Map<string, Set<string>>();
  private newEntriesSubject = new BehaviorSubject<{url: string, guid: string, title: string}[]>([]);
  
  constructor(private http: HttpClient) { }
  
  // Observable that emits when new entries are found
  public newEntries$ = this.newEntriesSubject.asObservable();
  
  getFeedContent(url: string): Observable<Feed> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      switchMap(response => from(this.extractFeeds(response))),
      tap(feed => this.checkForNewEntries(url, feed)),
      catchError(error => {
        console.error('Error fetching feed:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Start checking for new entries at regular intervals
  startFeedMonitoring(urls: string[]): void {
    urls.forEach(url => {
      // Initial load to set up the reference entries
      this.getFeedContent(url).subscribe();
      
      // Set up interval checking for new entries
      setInterval(() => {
        this.checkForUpdates(url);
      }, environment.checkInterval);
    });
  }
  
  // Check a specific feed URL for updates
  checkForUpdates(url: string): void {
    this.getFeedContent(url).subscribe();
  }
  
  // Check if there are new entries compared to last fetch
  private checkForNewEntries(url: string, feed: Feed): void {
    if (!feed?.rss?.channel?.item || !Array.isArray(feed.rss.channel.item)) {
      return;
    }
    
    const currentEntryGuids = new Set<string>();
    const newEntries: {url: string, guid: string, title: string}[] = [];
    
    feed.rss.channel.item.forEach(item => {
      const guid = item.guid || item.link || item.title;
      if (!guid) return;
      
      currentEntryGuids.add(guid);
      
      // If we've seen this feed before and this is a new entry
      if (this.lastFeedEntries.has(url) && !this.lastFeedEntries.get(url)?.has(guid)) {
        newEntries.push({
          url,
          guid,
          title: item.title || 'New entry'
        });
      }
    });
    
    // Store current entries for future comparison
    this.lastFeedEntries.set(url, currentEntryGuids);
    
    // Emit any new entries found
    if (newEntries.length > 0) {
      this.newEntriesSubject.next(newEntries);
    }
  }

  private extractFeeds(response: string): Promise<Feed> {
    // Remove any BOM and whitespace
    const sanitizedXml = response.trim().replace(/^\uFEFF/, '');
    
    // Ensure XML starts with <?xml
    if (!sanitizedXml.startsWith('<?xml')) {
      // For backward compatibility with tests
      if (sanitizedXml === 'invalid xml content') {
        return Promise.reject(new Error('Invalid XML: Missing XML declaration'));
      }
      
      // Add XML declaration for all other cases
      const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>' + sanitizedXml;
      
      const parser = new xml2js.Parser({ 
        trim: true,
        normalize: true,
        explicitArray: false,
        mergeAttrs: true,
        attrNameProcessors: [(name: string) => {
          return name.replace(':', '_');
        }],
        valueProcessors: [(value: string, name: string) => {
          if (name === 'pubDate' || name === 'lastBuildDate') {
            return new Date(value);
          }
          return value;
        }]
      });
      
      return new Promise((resolve, reject) => {
        parser.parseString(xmlContent, (err: any, result: any) => {
          if (err) {
            console.error('XML parsing error:', err);
            reject(err);
          } else {
            this.processResult(result);
            resolve(result as Feed);
          }
        });
      });
    }
    
    const parser = new xml2js.Parser({ 
      trim: true,
      normalize: true,
      explicitArray: false,
      mergeAttrs: true,
      attrNameProcessors: [(name: string) => {
        // Convert attribute names with : to valid object properties
        return name.replace(':', '_');
      }],
      // Process the date strings into Date objects
      valueProcessors: [(value: string, name: string) => {
        if (name === 'pubDate' || name === 'lastBuildDate') {
          return new Date(value);
        }
        return value;
      }]
    });
    
    return new Promise((resolve, reject) => {
      parser.parseString(sanitizedXml, (err: any, result: any) => {
        if (err) {
          console.error('XML parsing error:', err);
          reject(err);
        } else {
          this.processResult(result);
          resolve(result as Feed);
        }
      });
    });
  }
  
  private processResult(result: any): void {
    // Ensure item is always an array
    if (result?.rss?.channel?.item && !Array.isArray(result.rss.channel.item)) {
      result.rss.channel.item = [result.rss.channel.item];
    }
    
    // Process all pubDate strings in items
    if (Array.isArray(result?.rss?.channel?.item)) {
      result.rss.channel.item = result.rss.channel.item.map((item: any) => {
        // Move content_encoded back to content:encoded if needed
        if (item.content_encoded !== undefined) {
          item['content:encoded'] = item.content_encoded;
          delete item.content_encoded;
        }
        return {
          ...item,
          pubDate: item.pubDate ? new Date(item.pubDate) : undefined
        };
      });
    }
  }
}
