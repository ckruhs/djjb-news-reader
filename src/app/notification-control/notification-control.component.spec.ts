import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon'; 
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { NotificationControlComponent } from './notification-control.component';

describe('NotificationControlComponent', () => {
  let component: NotificationControlComponent;
  let fixture: ComponentFixture<NotificationControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule, 
        MatIconModule,
        MatButtonModule,
        CommonModule,
        NotificationControlComponent
      ],
      // Mock SwPush dependency
      providers: [
        { provide: SwPush, useValue: {
          messages: of({ message: 'Test push message' }),
          subscription: jasmine.createSpy('subscription'),
          requestSubscription: jasmine.createSpy('requestSubscription')
        }}
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NotificationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
