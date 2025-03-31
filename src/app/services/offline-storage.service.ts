import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { FeedEntry } from '../api/feed-entry';
import { Feed } from '../api/feed';

interface OfflineQueue {
  type: 'notification' | 'feedFetch';
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase>;
  private readonly DB_NAME = 'djjb-news-reader-db';
  private readonly DB_VERSION = 1;
  private readonly FEEDS_STORE = 'feeds';
  private readonly FEED_ENTRIES_STORE = 'feedEntries';
  private readonly QUEUE_STORE = 'offlineQueue';

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    this.dbPromise = openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create stores
        if (!db.objectStoreNames.contains('feeds')) {
          db.createObjectStore('feeds', { keyPath: 'url' });
        }
        
        if (!db.objectStoreNames.contains('feedEntries')) {
          db.createObjectStore('feedEntries', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      }
    });
  }

  /**
   * Save a feed to IndexedDB
   */
  async saveFeed(feed: Feed): Promise<void> {
    const db = await this.dbPromise;
    await db.put(this.FEEDS_STORE, {
      ...feed,
      timestamp: Date.now()
    });
  }

  /**
   * Get a feed from IndexedDB by URL
   */
  async getFeed(url: string): Promise<Feed | undefined> {
    const db = await this.dbPromise;
    return db.get(this.FEEDS_STORE, url);
  }

  /**
   * Save feed entries to IndexedDB
   */
  async saveFeedEntries(entries: FeedEntry[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.FEED_ENTRIES_STORE, 'readwrite');
    await Promise.all([
      ...entries.map(entry => tx.store.put({
        ...entry,
        timestamp: Date.now()
      })),
      tx.done
    ]);
  }

  /**
   * Get all feed entries from IndexedDB
   */
  async getAllFeedEntries(): Promise<FeedEntry[]> {
    const db = await this.dbPromise;
    return db.getAll(this.FEED_ENTRIES_STORE);
  }

  /**
   * Add an item to the offline queue
   */
  async addToOfflineQueue(type: 'notification' | 'feedFetch', data: any): Promise<void> {
    const db = await this.dbPromise;
    await db.add(this.QUEUE_STORE, {
      type,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get all items from the offline queue
   */
  async getOfflineQueue(): Promise<OfflineQueue[]> {
    const db = await this.dbPromise;
    return db.getAll(this.QUEUE_STORE);
  }

  /**
   * Remove an item from the offline queue
   */
  async removeFromOfflineQueue(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(this.QUEUE_STORE, id);
  }

  /**
   * Clear all items from the offline queue
   */
  async clearOfflineQueue(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(this.QUEUE_STORE);
  }
}