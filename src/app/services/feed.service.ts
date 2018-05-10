import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';


import * as xml2js from 'xml2js';

import { Feed, Rss, FeedInfo } from '../api/feed';

@Injectable()
export class FeedService {

  constructor(private http: HttpClient) { }

  getFeedContent(url: string): Observable<Feed> {
    return this.http.get(url, {responseType: 'text'})
      .map(this.extractFeeds);
  }

/**
 * Converts the feed response to json
 *
 * @private
 * @param {any} response
 * @returns {Feed}
 * @memberof FeedService
 */
private extractFeeds(response: any): Feed {
    const parser = new xml2js.Parser({explicitArray : false, mergeAttrs : true});
    let feed;
    parser.parseString(response,  function (err, result) {
      if (err) {
        console.warn(err);
      }
      feed = result;
    });

    return feed || { };
  }

}
