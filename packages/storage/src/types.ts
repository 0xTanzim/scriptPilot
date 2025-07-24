import type { Script, Settings } from '@scriptpilot/types';

/**
 * Extended script execution with database ID for storage
 */
export interface StorageScriptExecution {
  /** Database ID */
  id: string;
  /** Script ID */
  scriptId: string;
  /** Execution timestamp */
  timestamp: Date;
  /** Target URL */
  url: string;
  /** Execution duration in ms */
  duration: number;
  /** Whether execution was successful */
  success: boolean;
  /** Execution status */
  status: 'success' | 'error' | 'timeout';
  /** Error message if failed */
  error?: string;
  /** Console logs during execution */
  logs: Array<{
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: Date;
    data?: unknown[];
  }>;
}

/**
 * Storage adapter interface for different storage backends
 */
export interface StorageAdapter {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  getBatch(keys: string[]): Promise<Record<string, any>>;
  setBatch(items: Record<string, any>): Promise<void>;
  removeBatch(keys: string[]): Promise<void>;
}

/**
 * Storage service interface
 */
export interface StorageService {
  scripts: ScriptStorageService;
  settings: SettingsStorageService;
  sync: SyncService;
  backup: BackupService;
}

/**
 * Script storage operations
 */
export interface ScriptStorageService {
  getScript(id: string): Promise<Script | null>;
  getAllScripts(): Promise<Script[]>;
  saveScript(script: Script): Promise<void>;
  updateScript(id: string, updates: Partial<Script>): Promise<void>;
  deleteScript(id: string): Promise<void>;
  searchScripts(query: string): Promise<Script[]>;
  getScriptsByDomain(domain: string): Promise<Script[]>;
  getEnabledScripts(): Promise<Script[]>;
  exportScripts(): Promise<Script[]>;
  importScripts(scripts: Script[]): Promise<void>;
}

/**
 * Settings storage operations
 */
export interface SettingsStorageService {
  getSettings(): Promise<Settings>;
  updateSettings(updates: Partial<Settings>): Promise<void>;
  resetSettings(): Promise<void>;
  exportSettings(): Promise<Settings>;
  importSettings(settings: Settings): Promise<void>;
}

/**
 * Sync service for cross-device synchronization
 */
export interface SyncService {
  isEnabled(): Promise<boolean>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  sync(): Promise<void>;
  getLastSyncTime(): Promise<Date | null>;
  onSyncConflict(handler: (local: any, remote: any) => any): void;
}

/**
 * Backup and restore service
 */
export interface BackupService {
  createBackup(): Promise<BackupData>;
  restoreBackup(backup: BackupData): Promise<void>;
  exportBackup(): Promise<string>;
  importBackup(backupJson: string): Promise<void>;
  getBackupHistory(): Promise<BackupMetadata[]>;
  deleteOldBackups(keepCount: number): Promise<void>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  useIndexedDB: boolean;
  useChromeStorage: boolean;
  enableSync: boolean;
  maxBackups: number;
  syncInterval: number;
  compression: boolean;
}

/**
 * Database schema versions
 */
export interface DatabaseSchema {
  version: number;
  stores: Record<string, string>;
  indices: Record<string, string[]>;
}

/**
 * Backup data structure
 */
export interface BackupData {
  version: string;
  timestamp: Date;
  scripts: Script[];
  settings: Settings;
  metadata: BackupMetadata;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  name: string;
  size: number;
  scriptCount: number;
  createdAt: Date;
  source: 'manual' | 'auto' | 'sync';
}

/**
 * Storage events
 */
export interface StorageEvents {
  'script:created': Script;
  'script:updated': { id: string; script: Script };
  'script:deleted': string;
  'settings:updated': Settings;
  'sync:started': void;
  'sync:completed': void;
  'sync:error': Error;
  'backup:created': BackupMetadata;
  'backup:restored': BackupMetadata;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalScripts: number;
  enabledScripts: number;
  totalSize: number;
  lastBackup: Date | null;
  lastSync: Date | null;
  indexedDBSize: number;
  chromeStorageSize: number;
}

/**
 * Migration function type
 */
export type MigrationFunction = (
  oldVersion: number,
  newVersion: number
) => Promise<void>;

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class SyncError extends StorageError {
  constructor(message: string, cause?: Error) {
    super(message, 'SYNC_ERROR', cause);
    this.name = 'SyncError';
  }
}

export class BackupError extends StorageError {
  constructor(message: string, cause?: Error) {
    super(message, 'BACKUP_ERROR', cause);
    this.name = 'BackupError';
  }
}

export class MigrationError extends StorageError {
  constructor(message: string, cause?: Error) {
    super(message, 'MIGRATION_ERROR', cause);
    this.name = 'MigrationError';
  }
}
