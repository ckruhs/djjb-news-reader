import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from '../environments/environment';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { ThumbnailPipe } from './pipes/thumbnail.pipe';
import { FeedService } from './services/feed.service';
import { NotificationControlComponent } from './notification-control/notification-control.component';

@NgModule({ declarations: [
        AppComponent,
        SpinnerComponent,
        ThumbnailPipe,
        NotificationControlComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatTabsModule,
        MatExpansionModule,
        MatButtonModule,
        MatIconModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production
        })], providers: [FeedService, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
