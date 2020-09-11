import { Component, OnInit, AfterViewInit, ElementRef, ViewEncapsulation, Renderer2, ViewChild } from '@angular/core';

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
  
  @ViewChild('lghost') lghost: ElementRef;

  constructor(
    private feedService: FeedService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.refreshFeed();
  }

  ngAfterViewInit() {
      const addtohomescript = document.createElement('script');
      addtohomescript.type = 'text/javascript';
      addtohomescript.innerHTML = 'addToHomescreen();';
      this.elementRef.nativeElement.appendChild(addtohomescript);

      const lgscript = document.createElement('script');
      lgscript.type = 'module';
      lgscript.src = 'https://djjb.foehst.net/lehrgangsanmeldung.js';
      this.elementRef.nativeElement.appendChild(lgscript);

      let lglist = document.createElement('x-lehrgangsanmeldung');
      lglist.style.cssText='font-size: .8em; overflow-y: auto;'
      this.lghost.nativeElement.appendChild(lglist)
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
