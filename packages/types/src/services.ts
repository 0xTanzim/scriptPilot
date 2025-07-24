// Service interfaces for ScriptPilot core functionality
import type { GMAPI } from './gm-api';
import type { Script, ScriptExecution } from './script';

export interface ScriptService {
  /** Execute a script */
  executeScript(
    script: Script,
    context: ExecutionContext
  ): Promise<ScriptExecution>;
  /** Parse script metadata from code */
  parseMetadata(code: string): Promise<Script['metadata']>;
  /** Validate script code */
  validateScript(code: string): Promise<ValidationResult>;
  /** Get execution context for URL */
  getExecutionContext(url: string): Promise<ExecutionContext>;
  /** Stop script execution */
  stopExecution(scriptId: string): Promise<void>;
  /** Get script execution stats */
  getExecutionStats(scriptId: string): Promise<ExecutionStats>;
}

export interface ExecutionContext {
  /** Target URL */
  url: string;
  /** Page title */
  title: string;
  /** Tab ID */
  tabId: number;
  /** Frame ID */
  frameId: number;
  /** GM API instance */
  gmAPI: GMAPI;
  /** Console logger */
  console: Console;
  /** Document object (if available) */
  document?: Document;
  /** Window object (if available) */
  window?: Window;
}

export interface ValidationResult {
  /** Whether script is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Parsed metadata */
  metadata?: Script['metadata'];
}

export interface ValidationError {
  /** Error message */
  message: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Error type */
  type: 'syntax' | 'metadata' | 'security' | 'compatibility';
}

export interface ValidationWarning {
  /** Warning message */
  message: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Warning type */
  type: 'deprecated' | 'performance' | 'best-practice';
}

export interface ExecutionStats {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successfulExecutions: number;
  /** Failed executions */
  failedExecutions: number;
  /** Average execution time */
  averageExecutionTime: number;
  /** Last execution */
  lastExecution?: ScriptExecution;
  /** Error rate percentage */
  errorRate: number;
}

export interface StorageService {
  /** Store script data */
  saveScript(script: Script): Promise<void>;
  /** Retrieve script by ID */
  getScript(id: string): Promise<Script | null>;
  /** Retrieve all scripts */
  getAllScripts(): Promise<Script[]>;
  /** Delete script */
  deleteScript(id: string): Promise<void>;
  /** Update script */
  updateScript(id: string, updates: Partial<Script>): Promise<void>;
  /** Search scripts */
  searchScripts(query: string): Promise<Script[]>;
  /** Store execution log */
  saveExecution(execution: ScriptExecution): Promise<void>;
  /** Get execution history */
  getExecutionHistory(
    scriptId: string,
    limit?: number
  ): Promise<ScriptExecution[]>;
  /** Clear execution history */
  clearExecutionHistory(scriptId: string): Promise<void>;
}

export interface SyncService {
  /** Sync data to cloud */
  syncToCloud(): Promise<void>;
  /** Sync data from cloud */
  syncFromCloud(): Promise<void>;
  /** Enable auto-sync */
  enableAutoSync(): Promise<void>;
  /** Disable auto-sync */
  disableAutoSync(): Promise<void>;
  /** Get sync status */
  getSyncStatus(): Promise<SyncStatus>;
}

export interface SyncStatus {
  /** Whether sync is enabled */
  enabled: boolean;
  /** Last sync timestamp */
  lastSync?: Date;
  /** Sync in progress */
  syncing: boolean;
  /** Sync error (if any) */
  error?: string;
  /** Number of pending changes */
  pendingChanges: number;
}

export interface UpdateService {
  /** Check for script updates */
  checkUpdates(): Promise<UpdateInfo[]>;
  /** Update a specific script */
  updateScript(scriptId: string): Promise<void>;
  /** Update all scripts */
  updateAllScripts(): Promise<void>;
  /** Enable auto-updates */
  enableAutoUpdates(): Promise<void>;
  /** Disable auto-updates */
  disableAutoUpdates(): Promise<void>;
}

export interface UpdateInfo {
  /** Script ID */
  scriptId: string;
  /** Current version */
  currentVersion: string;
  /** Available version */
  availableVersion: string;
  /** Update URL */
  updateUrl: string;
  /** Changelog */
  changelog?: string;
  /** Update size in bytes */
  size: number;
}

export interface NotificationService {
  /** Show notification */
  showNotification(options: NotificationOptions): Promise<void>;
  /** Show error notification */
  showError(message: string): Promise<void>;
  /** Show success notification */
  showSuccess(message: string): Promise<void>;
  /** Show warning notification */
  showWarning(message: string): Promise<void>;
}

export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Auto-close timeout in ms */
  timeout?: number;
  /** Click action */
  action?: () => void;
}
