import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private online$: Observable<boolean>;
  private connectionStatusChanged = new Subject<boolean>();

  constructor() {
    // Create observables for online and offline events
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    
    // Merge the two observables and add the current status
    this.online$ = merge(
      of(navigator.onLine),
      merge(offline$, online$)
    );

    // Subscribe to changes and emit to the subject
    this.online$.subscribe(status => {
      console.log('Network status changed:', status ? 'online' : 'offline');
      this.connectionStatusChanged.next(status);
    });
  }

  /**
   * Returns an observable that emits the current network status
   * and continues to emit when the status changes
   */
  public getNetworkStatus(): Observable<boolean> {
    return this.online$;
  }

  /**
   * Returns an observable that only emits when the connection status changes
   */
  public getConnectionStatusChanges(): Observable<boolean> {
    return this.connectionStatusChanged.asObservable();
  }

  /**
   * Returns true if the browser is currently online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }
}