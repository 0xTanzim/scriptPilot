// Settings and configuration types for ScriptPilot
export interface Settings {
  /** General settings */
  general: GeneralSettings;
  /** Script execution settings */
  execution: ExecutionSettings;
  /** UI/UX settings */
  ui: UISettings;
  /** Security settings */
  security: SecuritySettings;
  /** Sync settings */
  sync: SyncSettings;
  /** Backup settings */
  backup: BackupSettings;
  /** Developer settings */
  developer: DeveloperSettings;
}

export interface GeneralSettings {
  /** Enable ScriptPilot */
  enabled: boolean;
  /** Check for updates automatically */
  autoUpdateCheck: boolean;
  /** Update check interval in hours */
  updateCheckInterval: number;
  /** Show installation notifications */
  showInstallNotifications: boolean;
  /** Default script language */
  defaultLanguage: 'javascript' | 'typescript';
  /** Maximum concurrent script executions */
  maxConcurrentExecutions: number;
}

export interface ExecutionSettings {
  /** Default execution timeout in milliseconds */
  defaultTimeout: number;
  /** Enable script caching */
  enableCaching: boolean;
  /** Cache duration in minutes */
  cacheDuration: number;
  /** Enable debug mode */
  debugMode: boolean;
  /** Log execution details */
  logExecution: boolean;
  /** Maximum log entries per script */
  maxLogEntries: number;
  /** Enable source maps */
  enableSourceMaps: boolean;
  /** Strict mode enforcement */
  strictMode: boolean;
}

export interface UISettings {
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
  /** UI language/locale */
  locale: string;
  /** Show line numbers in editor */
  showLineNumbers: boolean;
  /** Editor font family */
  editorFontFamily: string;
  /** Editor font size */
  editorFontSize: number;
  /** Enable code folding */
  enableCodeFolding: boolean;
  /** Tab size for indentation */
  tabSize: number;
  /** Use spaces instead of tabs */
  insertSpaces: boolean;
  /** Enable minimap */
  enableMinimap: boolean;
  /** Word wrap setting */
  wordWrap: 'off' | 'on' | 'bounded';
}

export interface SecuritySettings {
  /** Require confirmation for dangerous APIs */
  confirmDangerousAPIs: boolean;
  /** Block scripts from untrusted sources */
  blockUntrustedSources: boolean;
  /** Trusted domains list */
  trustedDomains: string[];
  /** Enable sandboxing */
  enableSandboxing: boolean;
  /** CSP enforcement level */
  cspEnforcement: 'strict' | 'moderate' | 'permissive';
  /** Block eval and similar functions */
  blockEval: boolean;
  /** Network request filtering */
  networkFiltering: boolean;
  /** Maximum script size in bytes */
  maxScriptSize: number;
}

export interface SyncSettings {
  /** Enable cloud synchronization */
  enabled: boolean;
  /** Sync provider */
  provider: 'chrome' | 'firefox' | 'custom';
  /** Auto-sync interval in minutes */
  autoSyncInterval: number;
  /** Sync scripts */
  syncScripts: boolean;
  /** Sync settings */
  syncSettings: boolean;
  /** Sync execution logs */
  syncLogs: boolean;
  /** Conflict resolution strategy */
  conflictResolution: 'local' | 'remote' | 'prompt' | 'merge';
  /** Custom sync endpoint */
  customEndpoint?: string;
  /** Encryption enabled */
  encryption: boolean;
}

export interface BackupSettings {
  /** Enable automatic backups */
  autoBackup: boolean;
  /** Backup interval in hours */
  backupInterval: number;
  /** Maximum number of backups to keep */
  maxBackups: number;
  /** Include execution logs in backup */
  includeLogs: boolean;
  /** Compress backups */
  compression: boolean;
  /** Backup location preference */
  location: 'local' | 'cloud' | 'both';
  /** Custom backup path */
  customPath?: string;
}

export interface DeveloperSettings {
  /** Enable developer mode */
  enabled: boolean;
  /** Show debug console */
  showDebugConsole: boolean;
  /** Enable performance monitoring */
  enablePerfMonitoring: boolean;
  /** Hot reload for script changes */
  hotReload: boolean;
  /** Enable experimental features */
  experimentalFeatures: boolean;
  /** Custom DevTools port */
  devToolsPort?: number;
  /** Enable memory profiling */
  memoryProfiling: boolean;
  /** Source map generation */
  generateSourceMaps: boolean;
}

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS: Settings = {
  general: {
    enabled: true,
    autoUpdateCheck: true,
    updateCheckInterval: 24,
    showInstallNotifications: true,
    defaultLanguage: 'javascript',
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
    theme: 'auto',
    locale: 'en',
    showLineNumbers: true,
    editorFontFamily: 'JetBrains Mono, Fira Code, monospace',
    editorFontSize: 14,
    enableCodeFolding: true,
    tabSize: 2,
    insertSpaces: true,
    enableMinimap: true,
    wordWrap: 'on',
  },
  security: {
    confirmDangerousAPIs: true,
    blockUntrustedSources: false,
    trustedDomains: [],
    enableSandboxing: true,
    cspEnforcement: 'moderate',
    blockEval: false,
    networkFiltering: false,
    maxScriptSize: 1024 * 1024, // 1MB
  },
  sync: {
    enabled: false,
    provider: 'chrome',
    autoSyncInterval: 15,
    syncScripts: true,
    syncSettings: true,
    syncLogs: false,
    conflictResolution: 'prompt',
    encryption: true,
  },
  backup: {
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    includeLogs: false,
    compression: true,
    location: 'local',
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

/**
 * Settings validation schema
 */
export interface SettingsSchema {
  [key: string]: {
    type: 'boolean' | 'string' | 'number' | 'array' | 'object';
    required?: boolean;
    default?: any;
    min?: number;
    max?: number;
    enum?: any[];
    validation?: (value: any) => boolean | string;
  };
}

/**
 * Settings migration functions
 */
export type SettingsMigration = {
  version: string;
  migrate: (oldSettings: any) => Settings;
};

/**
 * Settings change event
 */
export interface SettingsChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  source: 'user' | 'sync' | 'migration' | 'reset';
}
