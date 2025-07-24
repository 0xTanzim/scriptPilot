// Core script interfaces for ScriptPilot userscript manager
export interface ScriptMetadata {
  /** Script name */
  name?: string;
  /** Script namespace */
  namespace?: string;
  /** Script version */
  version?: string;
  /** Script description */
  description?: string;
  /** Script author */
  author?: string;
  /** Homepage URL */
  homepage?: string;
  /** Support URL */
  supportURL?: string;
  /** Update URL for automatic updates */
  updateURL?: string;
  /** Download URL */
  downloadURL?: string;
  /** Icon URL */
  icon?: string;
  /** URL patterns to match */
  match: string[];
  /** URL patterns to exclude */
  exclude?: string[];
  /** Include glob patterns */
  include?: string[];
  /** Script run timing */
  runAt: 'document-start' | 'document-end' | 'document-idle';
  /** Required GM APIs */
  grant?: string[];
  /** External resources */
  resource?: Record<string, string>;
  /** Required libraries */
  require?: string[];
  /** Whether to run in sandbox */
  sandbox?: 'raw' | 'JavaScript' | 'DOM';
  /** Whether script runs on top frame only */
  noframes?: boolean;
}

export interface Script {
  /** Unique script identifier */
  id: string;
  /** Script source code */
  code: string;
  /** Parsed metadata from script header */
  metadata: ScriptMetadata;
  /** Whether script is enabled */
  enabled: boolean;
  /** Installation timestamp */
  installedAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Installation source */
  source: 'manual' | 'url' | 'greasyfork' | 'openuserjs' | 'github';
  /** Original installation URL */
  installUrl?: string;
  /** Script file size in bytes */
  size: number;
  /** Script execution count */
  executionCount: number;
  /** Last execution timestamp */
  lastExecuted?: Date;
  /** Script tags for organization */
  tags: string[];
  /** User notes */
  notes?: string;
}

export interface ScriptExecution {
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
  /** Error message if failed */
  error?: string;
  /** Console logs during execution */
  logs: LogEntry[];
}

export interface LogEntry {
  /** Log level */
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional data */
  data?: unknown[];
}

export type ScriptStatus = 'enabled' | 'disabled' | 'error' | 'updating';

export interface ScriptStatusInfo {
  /** Script ID */
  id: string;
  /** Script name */
  name: string;
  /** Whether script is enabled */
  enabled: boolean;
  /** Script version */
  version: string;
  /** Last execution time */
  lastExecution?: Date;
  /** Execution count */
  executionCount?: number;
}

export interface ScriptStats {
  /** Total scripts */
  totalScripts: number;
  /** Enabled scripts */
  enabledScripts: number;
  /** Disabled scripts */
  disabledScripts: number;
  /** Scripts with errors */
  errorScripts: number;
  /** Total executions today */
  executionsToday: number;
  /** Most active script */
  mostActiveScript?: string;
}
