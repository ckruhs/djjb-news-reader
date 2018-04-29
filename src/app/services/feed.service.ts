import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';

import * as xml2js from 'xml2js';

import { Feed, Rss, FeedInfo } from '../api/feed';

@Injectable()
export class FeedService {

  constructor(private http: Http) { }

  getFeedContent(url: string): Observable<Feed> {
    return this.http.get(url)
      .map(this.extractFeeds)
      .catch(this.handleError);
  }

/**
 * Converts the feed response to json
 *
 * @private
 * @param {Response} response
 * @returns {Feed}
 * @memberof FeedService
 */
private extractFeeds(response: Response): Feed {
    const parser = new xml2js.Parser({explicitArray : false, mergeAttrs : true});
    let feed;
    parser.parseString(response.text(),  function (err, result) {
      if (err) {
        console.warn(err);
      }
      feed = result;
    });

    return feed || { };
  }


private handleError (error: any) {
    const errorMessage = (error.message) ? error.message :
    error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errorMessage);
    return Observable.throw(errorMessage);
  }
}
