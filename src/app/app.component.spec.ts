import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { ThumbnailPipe } from './pipes/thumbnail.pipe';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatToolbarModule, MatExpansionModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FeedService } from './services/feed.service';

describe('AppComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserModule,
        HttpModule,
        MatToolbarModule,
        MatExpansionModule,
        NoopAnimationsModule
      ],
      declarations: [
        AppComponent,
        SpinnerComponent,
        ThumbnailPipe
      ],
      providers: [
        FeedService
      ],
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
