import Dexie, { Table } from 'dexie';
import type { StorageAdapter } from '../types';

interface StorageItem {
  key: string;
  value: any;
  updatedAt: Date;
}

/**
 * IndexedDB storage adapter using Dexie
 */
export class IndexedDBAdapter extends Dexie implements StorageAdapter {
  items!: Table<StorageItem>;

  constructor(databaseName = 'ScriptPilotStorage') {
    super(databaseName);

    this.version(1).stores({
      items: 'key, updatedAt',
    });

    this.items = this.table('items');
  }

  /**
   * Get a single value from storage
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const item = await this.items.get(key);
      return item ? item.value : null;
    } catch (error) {
      console.error(`Failed to get ${key} from IndexedDB:`, error);
      return null;
    }
  }

  /**
   * Set a single value in storage
   */
  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      await this.items.put({
        key,
        value,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Failed to set ${key} in IndexedDB:`, error);
      throw error;
    }
  }

  /**
   * Remove a single key from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await this.items.delete(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from IndexedDB:`, error);
      throw error;
    }
  }

  /**
   * Clear all data from storage
   */
  async clear(): Promise<void> {
    try {
      await this.items.clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const items = await this.items.toArray();
      return items.map(item => item.key);
    } catch (error) {
      console.error('Failed to get all keys from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Get multiple values in a single operation
   */
  async getBatch(keys: string[]): Promise<Record<string, any>> {
    try {
      const items = await this.items.where('key').anyOf(keys).toArray();
      const result: Record<string, any> = {};

      items.forEach(item => {
        result[item.key] = item.value;
      });

      return result;
    } catch (error) {
      console.error('Failed to get batch from IndexedDB:', error);
      return {};
    }
  }

  /**
   * Set multiple values in a single operation
   */
  async setBatch(items: Record<string, any>): Promise<void> {
    try {
      const storageItems: StorageItem[] = Object.entries(items).map(
        ([key, value]) => ({
          key,
          value,
          updatedAt: new Date(),
        })
      );

      await this.items.bulkPut(storageItems);
    } catch (error) {
      console.error('Failed to set batch in IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Remove multiple keys in a single operation
   */
  async removeBatch(keys: string[]): Promise<void> {
    try {
      await this.items.bulkDelete(keys);
    } catch (error) {
      console.error('Failed to remove batch from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getUsage(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      // Get estimated database size
      let bytesInUse = 0;

      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        bytesInUse = estimate.usage || 0;
      } else {
        // Fallback: estimate by serializing all data
        const allItems = await this.items.toArray();
        bytesInUse = new Blob([JSON.stringify(allItems)]).size;
      }

      // Get quota (default to 50% of available storage)
      let quota = 50 * 1024 * 1024; // 50MB default

      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota ? estimate.quota * 0.5 : quota;
      }

      return { bytesInUse, quota };
    } catch (error) {
      console.error('Failed to get IndexedDB usage:', error);
      return { bytesInUse: 0, quota: 0 };
    }
  }

  /**
   * Check if IndexedDB is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test by opening the database
      await this.open();
      return true;
    } catch (error) {
      console.error('IndexedDB is not available:', error);
      return false;
    }
  }

  /**
   * Get items with filtering and pagination
   */
  async getItemsWithFilter(options: {
    filter?: (item: StorageItem) => boolean;
    sortBy?: 'key' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<StorageItem[]> {
    try {
      let query = this.items.toCollection();

      // Apply filter
      if (options.filter) {
        query = query.filter(options.filter);
      }

      // Apply sorting and pagination
      if (options.sortBy) {
        const items = await query.toArray();
        items.sort((a, b) => {
          const aVal = a[options.sortBy!];
          const bVal = b[options.sortBy!];

          if (aVal < bVal) return options.sortOrder === 'desc' ? 1 : -1;
          if (aVal > bVal) return options.sortOrder === 'desc' ? -1 : 1;
          return 0;
        });

        // Apply pagination after sorting
        const start = options.offset || 0;
        const end = options.limit ? start + options.limit : undefined;
        return items.slice(start, end);
      }

      // Apply pagination without sorting
      if (options.offset) {
        query = query.offset(options.offset);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      return await query.toArray();
    } catch (error) {
      console.error('Failed to get filtered items:', error);
      return [];
    }
  }

  /**
   * Count items with optional filter
   */
  async count(filter?: (item: StorageItem) => boolean): Promise<number> {
    try {
      if (filter) {
        return await this.items.filter(filter).count();
      }
      return await this.items.count();
    } catch (error) {
      console.error('Failed to count items:', error);
      return 0;
    }
  }

  /**
   * Search items by key pattern
   */
  async searchByKey(pattern: string): Promise<StorageItem[]> {
    try {
      return await this.items
        .filter(item => item.key.includes(pattern))
        .toArray();
    } catch (error) {
      console.error('Failed to search by key:', error);
      return [];
    }
  }

  /**
   * Get items updated after a specific date
   */
  async getUpdatedAfter(date: Date): Promise<StorageItem[]> {
    try {
      return await this.items.where('updatedAt').above(date).toArray();
    } catch (error) {
      console.error('Failed to get updated items:', error);
      return [];
    }
  }

  /**
   * Export all data
   */
  async exportData(): Promise<Record<string, any>> {
    try {
      const items = await this.items.toArray();
      const result: Record<string, any> = {};

      items.forEach(item => {
        result[item.key] = {
          value: item.value,
          updatedAt: item.updatedAt,
        };
      });

      return result;
    } catch (error) {
      console.error('Failed to export data:', error);
      return {};
    }
  }

  /**
   * Import data (overwrites existing)
   */
  async importData(
    data: Record<string, { value: any; updatedAt?: Date }>
  ): Promise<void> {
    try {
      const storageItems: StorageItem[] = Object.entries(data).map(
        ([key, item]) => ({
          key,
          value: item.value,
          updatedAt: item.updatedAt || new Date(),
        })
      );

      await this.items.bulkPut(storageItems);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create IndexedDB adapter
 */
export function createIndexedDBAdapter(
  databaseName?: string
): IndexedDBAdapter {
  return new IndexedDBAdapter(databaseName);
}

/**
 * Utility to migrate data from one IndexedDB database to another
 */
export async function migrateIndexedDB(
  fromDbName: string,
  toDbName: string,
  keys?: string[]
): Promise<void> {
  const fromAdapter = new IndexedDBAdapter(fromDbName);
  const toAdapter = new IndexedDBAdapter(toDbName);

  try {
    await fromAdapter.open();
    await toAdapter.open();

    const keysToMigrate = keys || (await fromAdapter.getAllKeys());
    const data = await fromAdapter.getBatch(keysToMigrate);

    await toAdapter.setBatch(data);
    await fromAdapter.removeBatch(keysToMigrate);

    console.log(
      `Migrated ${keysToMigrate.length} items from ${fromDbName} to ${toDbName}`
    );
  } catch (error) {
    console.error(
      `Failed to migrate from ${fromDbName} to ${toDbName}:`,
      error
    );
    throw error;
  } finally {
    await fromAdapter.close();
    await toAdapter.close();
  }
}
