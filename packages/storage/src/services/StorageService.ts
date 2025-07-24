import type { Script, Settings } from '@scriptpilot/types';
import { DEFAULT_SETTINGS } from '@scriptpilot/types';
import { ChromeStorageAdapter } from '../adapters/ChromeStorageAdapter';
import type {
  BackupData,
  BackupMetadata,
  BackupService,
  ScriptStorageService,
  SettingsStorageService,
  StorageAdapter,
  StorageService,
  SyncService,
} from '../types';

/**
 * Main storage service implementation
 */
export class StorageServiceImpl implements StorageService {
  scripts: ScriptStorageService;
  settings: SettingsStorageService;
  sync: SyncService;
  backup: BackupService;

  private localAdapter: StorageAdapter;
  private syncAdapter: StorageAdapter;

  constructor() {
    this.localAdapter = new ChromeStorageAdapter('local');
    this.syncAdapter = new ChromeStorageAdapter('sync');

    this.scripts = new ScriptStorageServiceImpl(this.localAdapter);
    this.settings = new SettingsStorageServiceImpl(
      this.localAdapter,
      this.syncAdapter
    );
    this.sync = new SyncServiceImpl(this.syncAdapter);
    this.backup = new BackupServiceImpl(this.localAdapter);
  }
}

/**
 * Script storage implementation
 */
class ScriptStorageServiceImpl implements ScriptStorageService {
  private adapter: StorageAdapter;
  private prefix = 'script:';

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async getScript(id: string): Promise<Script | null> {
    return await this.adapter.get<Script>(`${this.prefix}${id}`);
  }

  async getAllScripts(): Promise<Script[]> {
    try {
      const keys = await this.adapter.getAllKeys();
      const scriptKeys = keys.filter(key => key.startsWith(this.prefix));
      const scripts = await this.adapter.getBatch(scriptKeys);
      return Object.values(scripts).filter(Boolean);
    } catch (error) {
      console.error('Failed to get all scripts:', error);
      return [];
    }
  }

  async saveScript(script: Script): Promise<void> {
    await this.adapter.set(`${this.prefix}${script.id}`, script);
  }

  async updateScript(id: string, updates: Partial<Script>): Promise<void> {
    const existing = await this.getScript(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      await this.saveScript(updated);
    }
  }

  async deleteScript(id: string): Promise<void> {
    await this.adapter.remove(`${this.prefix}${id}`);
  }

  async searchScripts(query: string): Promise<Script[]> {
    const scripts = await this.getAllScripts();
    const lowerQuery = query.toLowerCase();

    return scripts.filter(
      script =>
        script.metadata.name?.toLowerCase().includes(lowerQuery) ||
        script.metadata.author?.toLowerCase().includes(lowerQuery) ||
        script.metadata.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getScriptsByDomain(domain: string): Promise<Script[]> {
    const scripts = await this.getAllScripts();

    return scripts.filter(script => {
      return script.metadata.match.some(pattern => {
        if (pattern === '*') return true;
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(domain);
        }
        return pattern.includes(domain);
      });
    });
  }

  async getEnabledScripts(): Promise<Script[]> {
    const scripts = await this.getAllScripts();
    return scripts.filter(script => script.enabled);
  }

  async exportScripts(): Promise<Script[]> {
    return await this.getAllScripts();
  }

  async importScripts(scripts: Script[]): Promise<void> {
    const items: Record<string, Script> = {};
    scripts.forEach(script => {
      items[`${this.prefix}${script.id}`] = script;
    });
    await this.adapter.setBatch(items);
  }
}

/**
 * Settings storage implementation
 */
class SettingsStorageServiceImpl implements SettingsStorageService {
  private localAdapter: StorageAdapter;
  private syncAdapter: StorageAdapter;
  private key = 'settings';

  constructor(localAdapter: StorageAdapter, syncAdapter: StorageAdapter) {
    this.localAdapter = localAdapter;
    this.syncAdapter = syncAdapter;
  }

  async getSettings(): Promise<Settings> {
    // Try sync storage first, fallback to local
    let settings = await this.syncAdapter.get<Settings>(this.key);
    if (!settings) {
      settings = await this.localAdapter.get<Settings>(this.key);
    }

    // Return defaults if nothing found
    return settings || DEFAULT_SETTINGS;
  }

  async updateSettings(updates: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    const updated = this.mergeSettings(current, updates);

    // Save to both local and sync storage
    await Promise.all([
      this.localAdapter.set(this.key, updated),
      this.syncAdapter.set(this.key, updated),
    ]);
  }

  async resetSettings(): Promise<void> {
    await Promise.all([
      this.localAdapter.set(this.key, DEFAULT_SETTINGS),
      this.syncAdapter.set(this.key, DEFAULT_SETTINGS),
    ]);
  }

  async exportSettings(): Promise<Settings> {
    return await this.getSettings();
  }

  async importSettings(settings: Settings): Promise<void> {
    await Promise.all([
      this.localAdapter.set(this.key, settings),
      this.syncAdapter.set(this.key, settings),
    ]);
  }

  private mergeSettings(
    current: Settings,
    updates: Partial<Settings>
  ): Settings {
    const merged = { ...current };

    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Deep merge for nested objects
        (merged as any)[key] = {
          ...(merged as any)[key],
          ...value,
        };
      } else {
        (merged as any)[key] = value;
      }
    }

    return merged;
  }
}

/**
 * Sync service implementation
 */
class SyncServiceImpl implements SyncService {
  private adapter: StorageAdapter;
  private syncKey = 'sync:status';

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async isEnabled(): Promise<boolean> {
    const status = await this.adapter.get<{ enabled: boolean }>(this.syncKey);
    return status?.enabled || false;
  }

  async enable(): Promise<void> {
    await this.adapter.set(this.syncKey, {
      enabled: true,
      lastSync: new Date(),
    });
  }

  async disable(): Promise<void> {
    await this.adapter.set(this.syncKey, { enabled: false });
  }

  async sync(): Promise<void> {
    // TODO: Implement actual sync logic
    await this.adapter.set(this.syncKey, {
      enabled: true,
      lastSync: new Date(),
    });
  }

  async getLastSyncTime(): Promise<Date | null> {
    const status = await this.adapter.get<{ lastSync?: string }>(this.syncKey);
    return status?.lastSync ? new Date(status.lastSync) : null;
  }

  onSyncConflict(handler: (local: any, remote: any) => any): void {
    // TODO: Implement conflict resolution
  }
}

/**
 * Backup service implementation
 */
class BackupServiceImpl implements BackupService {
  private adapter: StorageAdapter;
  private backupKey = 'backup:';

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async createBackup(): Promise<BackupData> {
    const scripts = await this.adapter.getBatch(
      (await this.adapter.getAllKeys()).filter(key => key.startsWith('script:'))
    );

    const settings =
      (await this.adapter.get<Settings>('settings')) || DEFAULT_SETTINGS;

    const metadata: BackupMetadata = {
      id: `backup_${Date.now()}`,
      name: `Backup ${new Date().toLocaleString()}`,
      size: 0,
      scriptCount: Object.keys(scripts).length,
      createdAt: new Date(),
      source: 'manual',
    };

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date(),
      scripts: Object.values(scripts),
      settings,
      metadata,
    };

    // Calculate size
    metadata.size = new Blob([JSON.stringify(backup)]).size;

    // Save backup
    await this.adapter.set(`${this.backupKey}${metadata.id}`, backup);

    return backup;
  }

  async restoreBackup(backup: BackupData): Promise<void> {
    // Import scripts
    const scriptItems: Record<string, Script> = {};
    backup.scripts.forEach(script => {
      scriptItems[`script:${script.id}`] = script;
    });
    await this.adapter.setBatch(scriptItems);

    // Import settings
    await this.adapter.set('settings', backup.settings);
  }

  async exportBackup(): Promise<string> {
    const backup = await this.createBackup();
    return JSON.stringify(backup, null, 2);
  }

  async importBackup(backupJson: string): Promise<void> {
    const backup: BackupData = JSON.parse(backupJson);
    await this.restoreBackup(backup);
  }

  async getBackupHistory(): Promise<BackupMetadata[]> {
    const keys = await this.adapter.getAllKeys();
    const backupKeys = keys.filter(key => key.startsWith(this.backupKey));
    const backups = await this.adapter.getBatch(backupKeys);

    return Object.values(backups)
      .map((backup: BackupData) => backup.metadata)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteOldBackups(keepCount: number): Promise<void> {
    const history = await this.getBackupHistory();
    const toDelete = history.slice(keepCount);

    const keysToDelete = toDelete.map(
      backup => `${this.backupKey}${backup.id}`
    );
    await this.adapter.removeBatch(keysToDelete);
  }
}

/**
 * Factory function to create storage service
 */
export function createStorageService(): StorageService {
  return new StorageServiceImpl();
}

/**
 * Singleton instance
 */
let storageService: StorageService | null = null;

/**
 * Get singleton storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageService) {
    storageService = createStorageService();
  }
  return storageService;
}
