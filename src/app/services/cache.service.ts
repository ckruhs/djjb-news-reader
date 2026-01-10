import { Injectable } from '@angular/core';
import { Feed } from '../api/feed';
import { FeedEntry } from '../api/feed-entry';

/**
 * A service that manages in-memory cache for offline data access
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  // In-memory cache for feed data
  private feedCache: { [key: string]: Feed } = {};
  
  // Last update timestamp for each cache entry
  private lastUpdateTime: { [key: string]: number } = {};

  constructor() {
    // Try to load cache from sessionStorage when service starts
    this.loadCacheFromStorage();
  }

  /**
   * Store feed data in the in-memory cache
   */
  cacheFeed(url: string, feed: Feed): void {
    // Create a simplified key for storage
    const key = this.getSimpleCacheKey(url);
    
    // Store in memory
    this.feedCache[key] = feed;
    this.lastUpdateTime[key] = Date.now();
    
    // Also store in sessionStorage for page reloads
    this.saveCacheToStorage();
  }

  /**
   * Get cached feed data if available
   */
  getCachedFeed(url: string): Feed | null {
    const key = this.getSimpleCacheKey(url);
    return this.feedCache[key] || null;
  }

  /**
   * Check if there's cached data available for a URL
   */
  hasCachedFeed(url: string): boolean {
    const key = this.getSimpleCacheKey(url);
    return !!this.feedCache[key];
  }

  /**
   * Get the last update time for a cache entry
   */
  getLastUpdateTime(url: string): number {
    const key = this.getSimpleCacheKey(url);
    return this.lastUpdateTime[key] || 0;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.feedCache = {};
    this.lastUpdateTime = {};
    sessionStorage.removeItem('feed_cache');
    sessionStorage.removeItem('feed_timestamps');
  }

  /**
   * Create a simple consistent key for cache storage
   */
  private getSimpleCacheKey(url: string): string {
    if (url.includes('index.rss')) {
      return 'index_rss';
    }
    return url.replace(/[^a-z0-9]/gi, '_');
  }

  /**
   * Save the current cache to sessionStorage
   */
  private saveCacheToStorage(): void {
    try {
      sessionStorage.setItem('feed_cache', JSON.stringify(this.feedCache));
      sessionStorage.setItem('feed_timestamps', JSON.stringify(this.lastUpdateTime));
    } catch (e) {
      console.warn('Failed to save cache to sessionStorage:', e);
    }
  }

  /**
   * Load cache data from sessionStorage if available
   */
  private loadCacheFromStorage(): void {
    try {
      const cachedFeeds = sessionStorage.getItem('feed_cache');
      const cachedTimestamps = sessionStorage.getItem('feed_timestamps');
      
      if (cachedFeeds) {
        this.feedCache = JSON.parse(cachedFeeds);
      }
      
      if (cachedTimestamps) {
        this.lastUpdateTime = JSON.parse(cachedTimestamps);
      }
    } catch (e) {
      console.warn('Failed to load cache from sessionStorage:', e);
    }
  }
}