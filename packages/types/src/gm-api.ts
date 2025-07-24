// GM (GreaseMonkey) API interfaces for userscript compatibility
export interface GMStorage {
  /** Store a value with a key */
  setValue(key: string, value: unknown): Promise<void>;
  /** Retrieve a value by key */
  getValue(key: string, defaultValue?: unknown): Promise<unknown>;
  /** Delete a value by key */
  deleteValue(key: string): Promise<void>;
  /** List all stored keys */
  listValues(): Promise<string[]>;
}

export interface GMXhrOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  data?: string | ArrayBuffer | FormData;
  /** Response type */
  responseType?: 'text' | 'json' | 'arraybuffer' | 'blob' | 'document';
  /** Request timeout in ms */
  timeout?: number;
  /** Whether to include credentials */
  withCredentials?: boolean;
  /** Upload progress callback */
  onprogress?: (event: ProgressEvent) => void;
  /** Request ready state change callback */
  onreadystatechange?: (response: GMXhrResponse) => void;
  /** Request load callback */
  onload?: (response: GMXhrResponse) => void;
  /** Request error callback */
  onerror?: (response: GMXhrResponse) => void;
  /** Request timeout callback */
  ontimeout?: (response: GMXhrResponse) => void;
  /** Request abort callback */
  onabort?: (response: GMXhrResponse) => void;
}

export interface GMXhrResponse {
  /** Response text */
  responseText: string;
  /** Response data (based on responseType) */
  response: string | ArrayBuffer | Blob | Document | object;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  responseHeaders: string;
  /** Ready state */
  readyState: number;
  /** Final URL after redirects */
  finalUrl: string;
}

export interface GMNotification {
  /** Notification title */
  title: string;
  /** Notification body text */
  text: string;
  /** Notification image URL */
  image?: string;
  /** Click callback */
  onclick?: () => void;
  /** Close callback */
  ondone?: () => void;
  /** Timeout in ms */
  timeout?: number;
}

export interface GMMenuCommand {
  /** Unique command ID */
  id: string;
  /** Menu item text */
  caption: string;
  /** Click callback */
  onclick: () => void;
  /** Keyboard shortcut */
  accessKey?: string;
  /** Whether command is enabled */
  enabled?: boolean;
}

export interface GMTab {
  /** Tab ID */
  id: number;
  /** Tab URL */
  url: string;
  /** Tab title */
  title: string;
  /** Whether tab is active */
  active: boolean;
  /** Whether tab is loading */
  loading: boolean;
}

export interface GMWindow {
  /** Window ID */
  id: number;
  /** Window tabs */
  tabs: GMTab[];
  /** Whether window is focused */
  focused: boolean;
  /** Window type */
  type: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
}

export interface GMInfo {
  /** ScriptPilot version */
  version: string;
  /** Script handler name */
  scriptHandler: 'ScriptPilot';
  /** Platform information */
  platform: {
    os: string;
    arch: string;
    browserName: string;
    browserVersion: string;
  };
  /** Current script info */
  script: {
    name: string;
    namespace: string;
    version: string;
    description: string;
    excludes: string[];
    includes: string[];
    matches: string[];
    runAt: string;
    unwrap: boolean;
  };
}

// GM API function signatures
export interface GMAPI {
  // Storage
  GM_setValue: GMStorage['setValue'];
  GM_getValue: GMStorage['getValue'];
  GM_deleteValue: GMStorage['deleteValue'];
  GM_listValues: GMStorage['listValues'];

  // HTTP requests
  GM_xmlhttpRequest: (options: GMXhrOptions) => GMXhrResponse;

  // UI
  GM_notification: (options: GMNotification) => void;
  GM_registerMenuCommand: (
    caption: string,
    onclick: () => void,
    accessKey?: string
  ) => string;
  GM_unregisterMenuCommand: (commandId: string) => void;

  // Resources
  GM_getResourceText: (name: string) => string;
  GM_getResourceURL: (name: string) => string;

  // Tabs & Windows
  GM_openInTab: (url: string, active?: boolean) => GMTab;
  GM_closeTab: (tab: GMTab) => void;
  GM_focusTab: (tab: GMTab) => void;

  // Clipboard
  GM_setClipboard: (text: string, type?: 'text' | 'html') => void;

  // Information
  GM_info: GMInfo;

  // Logging
  GM_log: (message: string, level?: 'log' | 'info' | 'warn' | 'error') => void;

  // Download
  GM_download: (url: string, filename?: string) => Promise<void>;
}

export interface GMAPIContext extends GMStorage {
  /** Make XML HTTP request */
  xmlHttpRequest(options: GMXhrOptions): Promise<GMXhrResponse>;
  /** Open URL in new tab */
  openInTab(url: string, options?: { active?: boolean }): Promise<void>;
  /** Show notification */
  notification(message: string, title?: string): Promise<void>;
  /** Set clipboard content */
  setClipboard(text: string): Promise<void>;
  /** Add CSS style to page */
  addStyle(css: string): HTMLStyleElement;
  /** Get resource text */
  getResourceText(name: string): Promise<string>;
  /** Get resource URL */
  getResourceURL(name: string): Promise<string>;
  /** Register menu command */
  registerMenuCommand(caption: string, func: () => void): string;
  /** Unregister menu command */
  unregisterMenuCommand(id: string): void;
  /** Log message */
  log(message: any): void;
  /** Script information */
  info: GMInfo;
}
