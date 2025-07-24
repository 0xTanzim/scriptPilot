import type { Plugin, PluginContext } from '@scriptpilot/types';

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Whether to isolate global variables */
  isolateGlobals?: boolean;
  /** Whether to restrict DOM access */
  restrictDOM?: boolean;
  /** Whether to restrict network access */
  restrictNetwork?: boolean;
  /** Timeout for plugin operations in milliseconds */
  timeout?: number;
  /** Maximum memory usage in bytes */
  maxMemory?: number;
  /** Allowed global objects */
  allowedGlobals?: string[];
}

/**
 * Sandbox execution result
 */
export interface SandboxResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  executionTime: number;
  memoryUsage: number;
}

/**
 * Plugin execution sandbox
 */
export class PluginSandbox {
  private config: SandboxConfig;
  private isolatedGlobals: Map<string, any> = new Map();

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = {
      isolateGlobals: true,
      restrictDOM: false,
      restrictNetwork: false,
      timeout: 30000, // 30 seconds
      maxMemory: 50 * 1024 * 1024, // 50MB
      allowedGlobals: [
        'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
        'Promise', 'Date', 'Math', 'JSON', 'Object', 'Array', 'String', 
        'Number', 'Boolean', 'RegExp', 'Error', 'TypeError', 'ReferenceError'
      ],
      ...config
    };
  }

  /**
   * Execute plugin method in sandbox
   */
  async executeMethod<T = any>(
    plugin: Plugin,
    methodName: keyof Plugin,
    context: PluginContext,
    ...args: any[]
  ): Promise<SandboxResult<T>> {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    try {
      // Get the method
      const method = plugin[methodName];
      if (typeof method !== 'function') {
        throw new Error(`Plugin method ${String(methodName)} is not a function`);
      }

      // Create execution promise
      const executionPromise = this.createExecutionPromise(method, plugin, context, args);

      // Apply timeout
      const timeoutPromise = this.createTimeoutPromise();

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      // Check memory usage
      if (memoryUsage > this.config.maxMemory!) {
        throw new Error(`Plugin exceeded memory limit: ${memoryUsage} bytes`);
      }

      return {
        success: true,
        result: result as T,
        executionTime,
        memoryUsage
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime,
        memoryUsage
      };
    }
  }

  /**
   * Execute arbitrary code in sandbox
   */
  async executeCode<T = any>(
    code: string,
    context: PluginContext,
    globals: Record<string, any> = {}
  ): Promise<SandboxResult<T>> {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    try {
      // Create safe execution environment
      const safeGlobals = this.createSafeGlobals(globals);
      
      // Create isolated function
      const isolatedFunction = this.createIsolatedFunction(code, safeGlobals);

      // Execute with timeout
      const executionPromise = this.executeIsolatedFunction(isolatedFunction, context);
      const timeoutPromise = this.createTimeoutPromise();

      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      return {
        success: true,
        result,
        executionTime,
        memoryUsage
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime,
        memoryUsage
      };
    }
  }

  /**
   * Create Web Worker sandbox for heavy operations
   */
  async executeInWorker<T = any>(
    code: string,
    data: any = {}
  ): Promise<SandboxResult<T>> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        // Create worker code
        const workerCode = `
          self.onmessage = function(e) {
            try {
              const { code, data } = e.data;
              
              // Create execution function
              const execute = new Function('data', code);
              
              // Execute code
              const result = execute(data);
              
              // Send result
              self.postMessage({
                success: true,
                result: result
              });
            } catch (error) {
              self.postMessage({
                success: false,
                error: {
                  message: error.message,
                  stack: error.stack,
                  name: error.name
                }
              });
            }
          };
        `;

        // Create worker
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        // Set timeout
        const timeout = setTimeout(() => {
          worker.terminate();
          resolve({
            success: false,
            error: new Error('Worker execution timeout'),
            executionTime: Date.now() - startTime,
            memoryUsage: 0
          });
        }, this.config.timeout);

        // Handle worker response
        worker.onmessage = (event) => {
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(blob.toString());

          const { success, result, error } = event.data;
          const executionTime = Date.now() - startTime;

          if (success) {
            resolve({
              success: true,
              result,
              executionTime,
              memoryUsage: 0 // Can't measure worker memory from main thread
            });
          } else {
            resolve({
              success: false,
              error: new Error(error.message),
              executionTime,
              memoryUsage: 0
            });
          }
        };

        worker.onerror = (error) => {
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(blob.toString());

          resolve({
            success: false,
            error: new Error(`Worker error: ${error.message}`),
            executionTime: Date.now() - startTime,
            memoryUsage: 0
          });
        };

        // Send code to worker
        worker.postMessage({ code, data });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          executionTime: Date.now() - startTime,
          memoryUsage: 0
        });
      }
    });
  }

  /**
   * Validate plugin safety before execution
   */
  validatePluginSafety(plugin: Plugin): { safe: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      // Convert plugin to string for analysis
      const pluginStr = plugin.toString();

      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /eval\s*\(/, message: 'Uses eval()' },
        { pattern: /Function\s*\(/, message: 'Uses Function constructor' },
        { pattern: /document\.write/, message: 'Uses document.write' },
        { pattern: /innerHTML\s*=/, message: 'Uses innerHTML assignment' },
        { pattern: /\.call\s*\(\s*this/, message: 'Uses suspicious .call()' },
        { pattern: /window\[/, message: 'Accesses window object dynamically' },
        { pattern: /global\[/, message: 'Accesses global object dynamically' },
        { pattern: /process\./, message: 'Accesses Node.js process object' }
      ];

      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(pluginStr)) {
          issues.push(message);
        }
      }

      // Check methods
      if (plugin.register) {
        const registerStr = plugin.register.toString();
        if (registerStr.includes('prototype')) {
          issues.push('Modifies object prototypes');
        }
      }

      return {
        safe: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        safe: false,
        issues: [`Failed to analyze plugin: ${error}`]
      };
    }
  }

  /**
   * Create execution promise for plugin method
   */
  private createExecutionPromise<T>(
    method: Function,
    plugin: Plugin,
    context: PluginContext,
    args: any[]
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        // Bind method to plugin context
        const boundMethod = method.bind(plugin);
        
        // Execute method
        const result = boundMethod(context, ...args);
        
        // Handle promise results
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Plugin execution timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  /**
   * Create safe globals object
   */
  private createSafeGlobals(customGlobals: Record<string, any>): Record<string, any> {
    const safeGlobals: Record<string, any> = {};

    // Add allowed globals
    for (const globalName of this.config.allowedGlobals!) {
      if (globalName in globalThis) {
        safeGlobals[globalName] = (globalThis as any)[globalName];
      }
    }

    // Add custom globals
    Object.assign(safeGlobals, customGlobals);

    // Add restricted versions if needed
    if (this.config.restrictDOM) {
      safeGlobals.document = this.createRestrictedDocument();
    }

    if (this.config.restrictNetwork) {
      safeGlobals.fetch = this.createRestrictedFetch();
      safeGlobals.XMLHttpRequest = this.createRestrictedXHR();
    }

    return safeGlobals;
  }

  /**
   * Create isolated function from code
   */
  private createIsolatedFunction(code: string, globals: Record<string, any>): Function {
    const globalNames = Object.keys(globals);
    const globalValues = Object.values(globals);

    // Create function with controlled scope
    return new Function(...globalNames, `
      "use strict";
      ${code}
    `).bind(null, ...globalValues);
  }

  /**
   * Execute isolated function
   */
  private async executeIsolatedFunction(fn: Function, context: PluginContext): Promise<any> {
    return fn(context);
  }

  /**
   * Create restricted document object
   */
  private createRestrictedDocument(): Partial<Document> {
    return {
      createElement: (tagName: string) => {
        // Only allow safe elements
        const safeTags = ['div', 'span', 'p', 'a', 'img', 'button', 'input'];
        if (!safeTags.includes(tagName.toLowerCase())) {
          throw new Error(`Element type ${tagName} not allowed in sandbox`);
        }
        return document.createElement(tagName);
      },
      createTextNode: (text: string) => document.createTextNode(text),
      querySelector: () => {
        throw new Error('DOM queries not allowed in sandbox');
      },
      querySelectorAll: () => {
        throw new Error('DOM queries not allowed in sandbox');
      }
    };
  }

  /**
   * Create restricted fetch function
   */
  private createRestrictedFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      throw new Error('Network access not allowed in sandbox');
    };
  }

  /**
   * Create restricted XMLHttpRequest
   */
  private createRestrictedXHR(): typeof XMLHttpRequest {
    return class RestrictedXHR {
      constructor() {
        throw new Error('XMLHttpRequest not allowed in sandbox');
      }
    } as any;
  }

  /**
   * Get current memory usage (approximation)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Update sandbox configuration
   */
  updateConfig(newConfig: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current sandbox configuration
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  /**
   * Cleanup sandbox resources
   */
  destroy(): void {
    this.isolatedGlobals.clear();
  }
}
