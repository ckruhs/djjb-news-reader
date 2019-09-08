import { Component, OnInit, AfterViewInit, ElementRef, ViewEncapsulation } from '@angular/core';

import { delay } from 'rxjs/internal/operators';

import { FeedService } from './services/feed.service';
import { FeedEntry } from './api/feed-entry';
import { environment } from '../environments/environment';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ck-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css',
              '../assets/addtohomescreen.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewInit {
  feedLocation = environment.feedLocation + '?v=' + Math.random();  // prevent browser caching

  title: string;
  feeds: Array<FeedEntry> = [];

  constructor(
    private feedService: FeedService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.refreshFeed();
  }

  ngAfterViewInit() {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = 'addToHomescreen();';
      this.elementRef.nativeElement.appendChild(script);
  }

  refreshFeed() {
    this.feeds.length = 0;

    this.feedService.getFeedContent(this.feedLocation).pipe(delay(500))
        .subscribe(
            feed => {
              // console.log('feed: ' , feed);
              this.title = feed.rss.channel.description;
              this.feeds = feed.rss.channel.item;
            } ,
            error => console.log(error));
  }

  openLinkInBrowser(feed: { link: string; }) {
    window.open(feed.link);
  }
}
