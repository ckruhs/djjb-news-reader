import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatExpansionModule } from '@angular/material';

import { FeedService } from './services/feed.service';
import { SpinnerComponent } from './spinner/spinner.component';
import { ThumbnailPipe } from './pipes/thumbnail.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
    ThumbnailPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    MatToolbarModule,
    MatExpansionModule,
    NoopAnimationsModule
  ],
  providers: [
    FeedService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
