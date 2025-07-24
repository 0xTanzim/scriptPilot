// WebExtension specific types and interfaces
export interface ExtensionManifest {
  /** Manifest version */
  manifest_version: 3;
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Extension description */
  description: string;
  /** Extension permissions */
  permissions: string[];
  /** Host permissions */
  host_permissions: string[];
  /** Content scripts */
  content_scripts?: ContentScript[];
  /** Background script */
  background?: {
    service_worker: string;
    type?: 'module';
  };
  /** Extension action (popup) */
  action?: {
    default_popup: string;
    default_title: string;
    default_icon: Record<string, string>;
  };
  /** Web accessible resources */
  web_accessible_resources?: WebAccessibleResource[];
  /** Content security policy */
  content_security_policy?: {
    extension_pages: string;
  };
  /** Extension icons */
  icons: Record<string, string>;
}

export interface ContentScript {
  /** URL patterns to match */
  matches: string[];
  /** URL patterns to exclude */
  exclude_matches?: string[];
  /** Script files to inject */
  js?: string[];
  /** CSS files to inject */
  css?: string[];
  /** When to inject */
  run_at: 'document_start' | 'document_end' | 'document_idle';
  /** Whether to inject in all frames */
  all_frames?: boolean;
  /** Exclude main frame */
  exclude_globs?: string[];
  /** Include globs */
  include_globs?: string[];
}

export interface WebAccessibleResource {
  /** Resource files */
  resources: string[];
  /** URL patterns that can access */
  matches: string[];
  /** Use dynamic URL */
  use_dynamic_url?: boolean;
}

export interface ExtensionMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload?: unknown;
  /** Message ID for responses */
  id?: string;
  /** Tab ID (for tab-specific messages) */
  tabId?: number;
}

export interface ExtensionResponse {
  /** Response data */
  data?: unknown;
  /** Error message */
  error?: string;
  /** Success status */
  success: boolean;
  /** Message ID */
  id?: string;
}

// Chrome API type extensions
export interface ChromeTab {
  /** Tab ID */
  id?: number;
  /** Tab URL */
  url?: string;
  /** Tab title */
  title?: string;
  /** Whether tab is active */
  active: boolean;
  /** ScriptPilot specific data */
  scriptPilot?: {
    /** Active scripts in this tab */
    activeScripts: string[];
    /** Execution count */
    executionCount: number;
    /** Last execution time */
    lastExecution?: Date;
  };
}

export interface StorageArea {
  /** Get items from storage */
  get(
    keys?: string | string[] | Record<string, unknown>
  ): Promise<Record<string, unknown>>;
  /** Set items in storage */
  set(items: Record<string, unknown>): Promise<void>;
  /** Remove items from storage */
  remove(keys: string | string[]): Promise<void>;
  /** Clear all items */
  clear(): Promise<void>;
}

export interface ChromeStorage {
  /** Local storage */
  local: StorageArea;
  /** Sync storage */
  sync: StorageArea;
  /** Session storage */
  session?: StorageArea;
  /** Managed storage */
  managed: StorageArea;
}

export interface ExtensionSettings {
  /** Auto-update scripts */
  autoUpdate: boolean;
  /** Update check interval (hours) */
  updateInterval: number;
  /** Enable sync */
  syncEnabled: boolean;
  /** Debug mode */
  debugMode: boolean;
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
  /** Default script run timing */
  defaultRunAt: 'document-start' | 'document-end' | 'document-idle';
  /** Enable notifications */
  notifications: boolean;
  /** Max execution logs */
  maxExecutionLogs: number;
  /** Editor preferences */
  editor: EditorSettings;
  /** Advanced settings */
  advanced: AdvancedSettings;
}

export interface EditorSettings {
  /** Editor theme */
  theme: string;
  /** Font size */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Tab size */
  tabSize: number;
  /** Word wrap */
  wordWrap: boolean;
  /** Line numbers */
  lineNumbers: boolean;
  /** Minimap */
  minimap: boolean;
  /** Auto-save */
  autoSave: boolean;
  /** Auto-save delay (ms) */
  autoSaveDelay: number;
}

export interface AdvancedSettings {
  /** Enable experimental features */
  experimentalFeatures: boolean;
  /** CSP bypass (dangerous) */
  cspBypass: boolean;
  /** Custom user agent */
  customUserAgent?: string;
  /** Execution timeout (ms) */
  executionTimeout: number;
  /** Memory limit (MB) */
  memoryLimit: number;
  /** Enable debugging */
  enableDebugging: boolean;
}

export type ExtensionContext =
  | 'popup'
  | 'content'
  | 'background'
  | 'devtools'
  | 'options';

export interface ContextMessage {
  /** Message context */
  context: ExtensionContext;
  /** Message type */
  type: string;
  /** Message data */
  data?: unknown;
  /** Target context */
  target?: ExtensionContext;
}
