// Web Worker manager for sandboxed userscript execution
import type {
  ExecutionContext,
  GMAPI,
  LogEntry,
  Script,
} from '@scriptpilot/types';

interface WorkerExecutionOptions {
  script: Script;
  context: ExecutionContext;
  gmAPI: GMAPI;
}

interface WorkerExecutionResult {
  success: boolean;
  error?: string;
  logs: LogEntry[];
  returnValue?: unknown;
}

interface WorkerMessage {
  type: 'execute' | 'terminate' | 'log' | 'result' | 'error';
  payload?: unknown;
}

/**
 * Manages Web Worker execution for sandboxed userscript running
 * Provides isolation and security for script execution
 */
export class ScriptWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private executionPromises: Map<
    string,
    {
      resolve: (result: WorkerExecutionResult) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  /**
   * Execute a script in a Web Worker
   */
  async executeScript(
    options: WorkerExecutionOptions
  ): Promise<WorkerExecutionResult> {
    const { script, context, gmAPI } = options;
    const workerId = `${script.id}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      try {
        // Create Web Worker with script execution code
        const worker = this.createWorker();
        this.workers.set(workerId, worker);
        this.executionPromises.set(workerId, { resolve, reject });

        // Set up worker message handling
        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(workerId, event.data);
        };

        worker.onerror = error => {
          this.handleWorkerError(workerId, error);
        };

        // Send execution request to worker
        const executionData = {
          scriptCode: script.code,
          scriptId: script.id,
          context: {
            url: context.url,
            title: context.title,
            tabId: context.tabId,
            frameId: context.frameId,
          },
          gmAPI: this.serializeGMAPI(gmAPI),
        };

        worker.postMessage({
          type: 'execute',
          payload: executionData,
        });

        // Set execution timeout
        setTimeout(() => {
          if (this.executionPromises.has(workerId)) {
            this.terminateScript(workerId);
            reject(new Error('Script execution timeout'));
          }
        }, 30000); // 30 second timeout
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Terminate a running script
   */
  async terminateScript(scriptId: string): Promise<void> {
    const workerId = Array.from(this.workers.keys()).find(id =>
      id.startsWith(scriptId)
    );
    if (!workerId) return;

    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
    }

    const promise = this.executionPromises.get(workerId);
    if (promise) {
      promise.reject(new Error('Script execution terminated'));
      this.executionPromises.delete(workerId);
    }
  }

  /**
   * Clean up all workers
   */
  async dispose(): Promise<void> {
    for (const [workerId, worker] of this.workers) {
      worker.terminate();
      const promise = this.executionPromises.get(workerId);
      if (promise) {
        promise.reject(new Error('Worker manager disposed'));
      }
    }
    this.workers.clear();
    this.executionPromises.clear();
  }

  /**
   * Create a Web Worker for script execution
   */
  private createWorker(): Worker {
    // Create worker code as a blob URL
    const workerCode = this.getWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    try {
      return new Worker(workerUrl);
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
    }
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
    const promise = this.executionPromises.get(workerId);
    if (!promise) return;

    switch (message.type) {
      case 'result':
        promise.resolve(message.payload as WorkerExecutionResult);
        this.cleanupWorker(workerId);
        break;

      case 'error':
        promise.reject(new Error(message.payload as string));
        this.cleanupWorker(workerId);
        break;

      case 'log':
        // Handle logging from worker
        console.log('[Worker Log]', message.payload);
        break;

      default:
        console.warn('Unknown worker message type:', message.type);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    const promise = this.executionPromises.get(workerId);
    if (promise) {
      promise.reject(new Error(`Worker error: ${error.message}`));
      this.cleanupWorker(workerId);
    }
  }

  /**
   * Clean up worker and promises
   */
  private cleanupWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
    }
    this.executionPromises.delete(workerId);
  }

  /**
   * Serialize GM API for worker communication
   */
  private serializeGMAPI(gmAPI: GMAPI): Record<string, unknown> {
    // Since functions can't be serialized, we'll send placeholders
    // The worker will use postMessage to call back to the main thread
    return {
      GM_setValue: 'FUNCTION_PLACEHOLDER',
      GM_getValue: 'FUNCTION_PLACEHOLDER',
      GM_deleteValue: 'FUNCTION_PLACEHOLDER',
      GM_listValues: 'FUNCTION_PLACEHOLDER',
      GM_xmlhttpRequest: 'FUNCTION_PLACEHOLDER',
      GM_notification: 'FUNCTION_PLACEHOLDER',
      GM_info: gmAPI.GM_info,
      // ... other serializable properties
    };
  }

  /**
   * Get the Web Worker execution code
   */
  private getWorkerCode(): string {
    return `
      // Web Worker code for sandboxed userscript execution
      let scriptLogs = [];

      // Mock console for logging
      const console = {
        log: (...args) => logMessage('log', args),
        info: (...args) => logMessage('info', args),
        warn: (...args) => logMessage('warn', args),
        error: (...args) => logMessage('error', args),
        debug: (...args) => logMessage('debug', args),
      };

      // Mock window object with limited functionality
      const window = {
        location: { href: '' },
        document: {},
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        setInterval: (fn, ms) => setInterval(fn, ms),
        clearTimeout: (id) => clearTimeout(id),
        clearInterval: (id) => clearInterval(id),
      };

      // Mock document object
      const document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => null,
        createElement: () => ({}),
        addEventListener: () => {},
        removeEventListener: () => {},
        readyState: 'complete',
        location: { href: '' },
      };

      function logMessage(level, args) {
        const entry = {
          level,
          message: args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '),
          timestamp: new Date(),
          data: args,
        };
        scriptLogs.push(entry);
      }

      // Create GM API proxy that communicates with main thread
      function createGMAPIProxy(serializedAPI) {
        return {
          GM_setValue: (key, value) => {
            // This would send a message to main thread
            return Promise.resolve();
          },
          GM_getValue: (key, defaultValue) => {
            // This would send a message to main thread
            return Promise.resolve(defaultValue);
          },
          GM_deleteValue: (key) => {
            return Promise.resolve();
          },
          GM_listValues: () => {
            return Promise.resolve([]);
          },
          GM_log: (message, level = 'log') => {
            console[level](message);
          },
          GM_info: serializedAPI.GM_info || {},
          // ... other GM APIs would be implemented similarly
        };
      }

      // Handle execution requests
      self.onmessage = function(event) {
        const { type, payload } = event.data;

        if (type === 'execute') {
          try {
            const { scriptCode, scriptId, context, gmAPI } = payload;

            // Set up context
            window.location.href = context.url;
            document.location.href = context.url;

            // Create GM API proxy
            const GM = createGMAPIProxy(gmAPI);

            // Make GM APIs globally available
            Object.assign(self, GM);

            // Reset logs for this execution
            scriptLogs = [];

            // Execute the script in a try-catch
            let result;
            try {
              // Use Function constructor to execute script with controlled scope
              const scriptFunction = new Function(
                'console', 'window', 'document', 'GM_setValue', 'GM_getValue',
                'GM_deleteValue', 'GM_listValues', 'GM_log', 'GM_info',
                scriptCode
              );

              result = scriptFunction(
                console, window, document,
                GM.GM_setValue, GM.GM_getValue, GM.GM_deleteValue,
                GM.GM_listValues, GM.GM_log, GM.GM_info
              );
            } catch (error) {
              throw new Error(\`Script execution error: \${error.message}\`);
            }

            // Send success result
            self.postMessage({
              type: 'result',
              payload: {
                success: true,
                logs: scriptLogs,
                returnValue: result,
              },
            });

          } catch (error) {
            // Send error result
            self.postMessage({
              type: 'result',
              payload: {
                success: false,
                error: error.message,
                logs: scriptLogs,
              },
            });
          }
        }
      };

      // Handle worker errors
      self.onerror = function(error) {
        self.postMessage({
          type: 'error',
          payload: error.message,
        });
      };
    `;
  }
}
