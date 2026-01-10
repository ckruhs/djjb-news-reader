import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { NotificationService } from './notification.service';

// Define the SwPush mock correctly before it's used
const swPushMock = {
  messages: of({ message: 'Test push message' }),
  subscription: jasmine.createSpy('subscription'),
  requestSubscription: jasmine.createSpy('requestSubscription')
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Mock SwPush dependency
      providers: [
        { provide: SwPush, useValue: swPushMock }
      ],
      // Provide HttpClientTestingModule to resolve HttpClient dependency
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
