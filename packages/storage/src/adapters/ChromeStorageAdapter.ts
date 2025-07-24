import browser from 'webextension-polyfill';
import type { StorageAdapter } from '../types';

/**
 * Chrome Storage API adapter for ScriptPilot
 * Supports both local and sync storage areas
 */
export class ChromeStorageAdapter implements StorageAdapter {
  private area: 'local' | 'sync';

  constructor(area: 'local' | 'sync' = 'local') {
    this.area = area;
  }

  /**
   * Get a single value from storage
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const result = await browser.storage[this.area].get(key);
      return (result[key] as T) ?? null;
    } catch (error) {
      console.error(`Failed to get ${key} from ${this.area} storage:`, error);
      return null;
    }
  }

  /**
   * Set a single value in storage
   */
  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      await browser.storage[this.area].set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set ${key} in ${this.area} storage:`, error);
      throw error;
    }
  }

  /**
   * Remove a single key from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await browser.storage[this.area].remove(key);
    } catch (error) {
      console.error(
        `Failed to remove ${key} from ${this.area} storage:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clear all data from storage
   */
  async clear(): Promise<void> {
    try {
      await browser.storage[this.area].clear();
    } catch (error) {
      console.error(`Failed to clear ${this.area} storage:`, error);
      throw error;
    }
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const result = await browser.storage[this.area].get(null);
      return Object.keys(result);
    } catch (error) {
      console.error(`Failed to get all keys from ${this.area} storage:`, error);
      return [];
    }
  }

  /**
   * Get multiple values in a single operation
   */
  async getBatch(keys: string[]): Promise<Record<string, any>> {
    try {
      return await browser.storage[this.area].get(keys);
    } catch (error) {
      console.error(`Failed to get batch from ${this.area} storage:`, error);
      return {};
    }
  }

  /**
   * Set multiple values in a single operation
   */
  async setBatch(items: Record<string, any>): Promise<void> {
    try {
      await browser.storage[this.area].set(items);
    } catch (error) {
      console.error(`Failed to set batch in ${this.area} storage:`, error);
      throw error;
    }
  }

  /**
   * Remove multiple keys in a single operation
   */
  async removeBatch(keys: string[]): Promise<void> {
    try {
      await browser.storage[this.area].remove(keys);
    } catch (error) {
      console.error(`Failed to remove batch from ${this.area} storage:`, error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getUsage(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      let bytesInUse = 0;

      // Check if getBytesInUse is available
      if ('getBytesInUse' in browser.storage[this.area]) {
        bytesInUse = await (browser.storage[this.area] as any).getBytesInUse();
      } else {
        // Fallback: estimate size by serializing all data
        const allData = await browser.storage[this.area].get(null);
        bytesInUse = new Blob([JSON.stringify(allData)]).size;
      }

      // Chrome storage quotas
      const quotas = {
        local: 5 * 1024 * 1024, // 5MB for local storage
        sync: 100 * 1024, // 100KB for sync storage
      };

      return {
        bytesInUse,
        quota: quotas[this.area],
      };
    } catch (error) {
      console.error(`Failed to get storage usage for ${this.area}:`, error);
      return { bytesInUse: 0, quota: 0 };
    }
  }

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test by setting and removing a temporary key
      const testKey = '__scriptpilot_test__';
      await browser.storage[this.area].set({ [testKey]: 'test' });
      await browser.storage[this.area].remove(testKey);
      return true;
    } catch (error) {
      console.error(`${this.area} storage is not available:`, error);
      return false;
    }
  }

  /**
   * Listen for storage changes
   */
  onChanged(
    callback: (
      changes: Record<string, { oldValue?: any; newValue?: any }>
    ) => void
  ): () => void {
    const listener = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === this.area) {
        callback(changes);
      }
    };

    browser.storage.onChanged.addListener(listener);

    // Return unsubscribe function
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }

  /**
   * Get the storage area being used
   */
  getArea(): 'local' | 'sync' {
    return this.area;
  }

  /**
   * Switch storage area
   */
  setArea(area: 'local' | 'sync'): void {
    this.area = area;
  }
}

/**
 * Factory function to create Chrome Storage adapters
 */
export function createChromeStorageAdapter(
  area: 'local' | 'sync' = 'local'
): ChromeStorageAdapter {
  return new ChromeStorageAdapter(area);
}

/**
 * Utility to migrate data between storage areas
 */
export async function migrateStorageArea(
  fromArea: 'local' | 'sync',
  toArea: 'local' | 'sync',
  keys?: string[]
): Promise<void> {
  const fromAdapter = new ChromeStorageAdapter(fromArea);
  const toAdapter = new ChromeStorageAdapter(toArea);

  try {
    const keysToMigrate = keys || (await fromAdapter.getAllKeys());
    const data = await fromAdapter.getBatch(keysToMigrate);

    await toAdapter.setBatch(data);
    await fromAdapter.removeBatch(keysToMigrate);

    console.log(
      `Migrated ${keysToMigrate.length} items from ${fromArea} to ${toArea} storage`
    );
  } catch (error) {
    console.error(`Failed to migrate from ${fromArea} to ${toArea}:`, error);
    throw error;
  }
}
