import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as xml2js from 'xml2js';
import { Feed } from '../api/feed';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  constructor(private http: HttpClient) { }

  getFeedContent(url: string): Observable<Feed> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(this.extractFeeds),
      catchError(error => {
        console.error('Error fetching feed:', error);
        return throwError(() => error);
      })
    );
  }

  private extractFeeds(response: any): Feed {
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      mergeAttrs: true 
    });
    
    let feed: Feed;
    parser.parseString(response, (err: any, result: any) => {
      if (err) {
        console.error('XML parsing error:', err);
        throw err;
      }
      feed = result;
    });
    
    if (!feed) {
      throw new Error('Failed to parse feed content');
    }
    
    return feed;
  }
}
