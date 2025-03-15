// src/services/cacheService.ts
import NodeCache from 'node-cache';
import logger from '../utils/logger';

/**
 * Simple in-memory cache service for storing frequently accessed data
 */
class CacheService {
  private cache: NodeCache;
  
  constructor(ttlSeconds: number = 3600) { // Default TTL: 1 hour
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2, // Check for expired keys every 20% of TTL
      useClones: false, // Don't clone objects when storing/retrieving (for performance)
    });
    
    logger.info(`Cache service initialized with TTL of ${ttlSeconds} seconds`);
  }
  
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    
    if (value === undefined) {
      logger.debug(`Cache miss for key: ${key}`);
      return undefined;
    }
    
    logger.debug(`Cache hit for key: ${key}`);
    return value;
  }
  
  /**
   * Store value in cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Custom TTL in seconds (optional)
   * @returns true if stored successfully
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl);
    
    if (success) {
      logger.debug(`Cached value for key: ${key}${ttl ? ` with TTL ${ttl}s` : ''}`);
    } else {
      logger.warn(`Failed to cache value for key: ${key}`);
    }
    
    return success;
  }
  
  /**
   * Delete value from cache
   * @param key Cache key
   * @returns true if successfully deleted, false if not found
   */
  delete(key: string): boolean {
    const deleted = this.cache.del(key);
    
    if (deleted > 0) {
      logger.debug(`Deleted cache for key: ${key}`);
      return true;
    }
    
    logger.debug(`Cache key not found for deletion: ${key}`);
    return false;
  }
  
  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns true if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Create a singleton instance
const cacheService = new CacheService();

export default cacheService;