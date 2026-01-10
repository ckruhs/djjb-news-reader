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
  private readonly DB_VERSION = 2; // Increased version to trigger database upgrade
  private readonly FEEDS_STORE = 'feeds';
  private readonly FEED_ENTRIES_STORE = 'feedEntries';
  private readonly QUEUE_STORE = 'offlineQueue';

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    this.dbPromise = openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Handle database version upgrades
        if (oldVersion < 1) {
          // Create initial stores if this is a new database
          if (!db.objectStoreNames.contains('feeds')) {
            db.createObjectStore('feeds', { keyPath: 'url' });
          }
          
          if (!db.objectStoreNames.contains('offlineQueue')) {
            db.createObjectStore('offlineQueue', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
          }
        }
        
        // Version 1 to 2 upgrade: Change feedEntries keyPath from 'id' to 'guid'
        if (oldVersion < 2) {
          // Delete old store if it exists
          if (db.objectStoreNames.contains('feedEntries')) {
            db.deleteObjectStore('feedEntries');
          }
          
          // Create new store with correct keyPath
          db.createObjectStore('feedEntries', { keyPath: 'guid' });
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
    
    // Filter out entries without a guid, and add timestamp
    const validEntries = entries.filter(entry => !!entry.guid).map(entry => ({
      ...entry,
      timestamp: Date.now()
    }));
    
    if (validEntries.length === 0) {
      console.warn('No valid entries to save to offline storage (missing guid)');
      return;
    }
    
    await Promise.all([
      ...validEntries.map(entry => tx.store.put(entry)),
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