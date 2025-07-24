// Main types export for ScriptPilot
// Re-export all type definitions for easy importing

// Script related types
export * from './script';

// GM API types
export * from './gm-api';

// Plugin system types
export * from './plugin';

// Service interfaces
export * from './services';

// Settings and configuration
export type {
  BackupSettings,
  DeveloperSettings,
  ExecutionSettings,
  GeneralSettings,
  SecuritySettings,
  Settings,
  SettingsChangeEvent,
  SettingsMigration,
  SettingsSchema,
  SyncSettings,
  UISettings,
} from './settings';

// DEFAULT_SETTINGS constant - exported directly to avoid compilation issues
export const DEFAULT_SETTINGS = {
  general: {
    enabled: true,
    autoUpdateCheck: true,
    updateCheckInterval: 24,
    showInstallNotifications: true,
    defaultLanguage: 'javascript' as const,
    maxConcurrentExecutions: 10,
  },
  execution: {
    defaultTimeout: 30000,
    enableCaching: true,
    cacheDuration: 60,
    debugMode: false,
    logExecution: true,
    maxLogEntries: 100,
    enableSourceMaps: true,
    strictMode: false,
  },
  ui: {
    theme: 'auto' as const,
    locale: 'en',
    showLineNumbers: true,
    editorFontFamily: 'JetBrains Mono, Fira Code, monospace',
    editorFontSize: 14,
    enableCodeFolding: true,
    tabSize: 2,
    insertSpaces: true,
    enableMinimap: true,
    wordWrap: 'on' as const,
  },
  security: {
    confirmDangerousAPIs: true,
    blockUntrustedSources: false,
    trustedDomains: [],
    enableSandboxing: true,
    cspEnforcement: 'moderate' as const,
    blockEval: false,
    networkFiltering: false,
    maxScriptSize: 1024 * 1024, // 1MB
  },
  sync: {
    enabled: false,
    provider: 'chrome' as const,
    autoSyncInterval: 15,
    syncScripts: true,
    syncSettings: true,
    syncLogs: false,
    conflictResolution: 'prompt' as const,
    encryption: true,
  },
  backup: {
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    includeLogs: false,
    compression: true,
    location: 'local' as const,
  },
  developer: {
    enabled: false,
    showDebugConsole: false,
    enablePerfMonitoring: false,
    hotReload: false,
    experimentalFeatures: false,
    memoryProfiling: false,
    generateSourceMaps: true,
  },
};

// WebExtension types
export * from './extension';

// Utility types
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** Success status */
  success: boolean;
  /** Status code */
  statusCode?: number;
  /** Response message */
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  /** Pagination info */
  pagination: {
    /** Current page */
    page: number;
    /** Items per page */
    limit: number;
    /** Total items */
    total: number;
    /** Total pages */
    totalPages: number;
    /** Has next page */
    hasNext: boolean;
    /** Has previous page */
    hasPrevious: boolean;
  };
}

export interface SearchOptions {
  /** Search query */
  query?: string;
  /** Filter options */
  filters?: Record<string, unknown>;
  /** Sort options */
  sort?: {
    /** Field to sort by */
    field: string;
    /** Sort direction */
    direction: 'asc' | 'desc';
  };
  /** Pagination */
  pagination?: {
    /** Page number */
    page: number;
    /** Items per page */
    limit: number;
  };
}

export interface EventPayload<T = unknown> {
  /** Event type */
  type: string;
  /** Event data */
  data: T;
  /** Event timestamp */
  timestamp: Date;
  /** Event source */
  source: string;
}

// Common error types
export class ScriptPilotError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ScriptPilotError';
  }
}

export class ValidationError extends ScriptPilotError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends ScriptPilotError {
  constructor(message: string, details?: unknown) {
    super(message, 'EXECUTION_ERROR', details);
    this.name = 'ExecutionError';
  }
}

export class StorageError extends ScriptPilotError {
  constructor(message: string, details?: unknown) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class NetworkError extends ScriptPilotError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

// Version information
export const VERSION = '0.1.0';
export const API_VERSION = 'v1';

// Constants
export const CONSTANTS = {
  /** Maximum script size in bytes (1MB) */
  MAX_SCRIPT_SIZE: 1024 * 1024,
  /** Maximum number of scripts */
  MAX_SCRIPTS: 1000,
  /** Default execution timeout (30 seconds) */
  DEFAULT_EXECUTION_TIMEOUT: 30000,
  /** Maximum execution logs per script */
  MAX_EXECUTION_LOGS: 100,
  /** Supported script languages */
  SUPPORTED_LANGUAGES: ['javascript', 'typescript'] as const,
  /** Default update check interval (24 hours) */
  DEFAULT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000,
} as const;

export type SupportedLanguage = (typeof CONSTANTS.SUPPORTED_LANGUAGES)[number];
