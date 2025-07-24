// TypeScript ScriptService for Web Worker execution with GM APIs
import type {
  ExecutionContext,
  ExecutionStats,
  ScriptService as IScriptService,
  Script,
  ScriptExecution,
  ValidationResult,
} from '@scriptpilot/types';

import { ExecutionError } from '@scriptpilot/types';

import { GMAPIProvider } from '../gm-api/GMAPIProvider';
import { MetadataParser } from '../utils/MetadataParser';
import { ScriptValidator } from '../validation/ScriptValidator';
import { ScriptWorkerManager } from './ScriptWorkerManager';

/**
 * Core script execution service with Web Worker sandboxing
 * Implements SOLID principles with dependency injection
 */
export class ScriptService implements IScriptService {
  private validator: ScriptValidator;
  private parser: MetadataParser;
  private gmApiProvider: GMAPIProvider;
  private workerManager: ScriptWorkerManager;
  private executionStats: Map<string, ExecutionStats> = new Map();

  constructor(
    validator?: ScriptValidator,
    parser?: MetadataParser,
    gmApiProvider?: GMAPIProvider,
    workerManager?: ScriptWorkerManager
  ) {
    // Dependency injection with default implementations
    this.validator = validator ?? new ScriptValidator();
    this.parser = parser ?? new MetadataParser();
    this.gmApiProvider = gmApiProvider ?? new GMAPIProvider();
    this.workerManager = workerManager ?? new ScriptWorkerManager();
  }

  /**
   * Execute a script in a sandboxed Web Worker environment
   */
  async executeScript(
    script: Script,
    context: ExecutionContext
  ): Promise<ScriptExecution> {
    const startTime = Date.now();
    const execution: ScriptExecution = {
      scriptId: script.id,
      timestamp: new Date(),
      url: context.url,
      duration: 0,
      success: false,
      logs: [],
    };

    try {
      // Validate script before execution
      const validation = await this.validateScript(script.code);
      if (!validation.valid) {
        throw new ExecutionError(
          `Script validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          { validation }
        );
      }

      // Create GM API instance for this execution context
      const gmAPI = await this.gmApiProvider.createAPI(context);

      // Execute script in Web Worker
      const result = await this.workerManager.executeScript({
        script,
        context,
        gmAPI,
      });

      execution.success = true;
      execution.logs = result.logs || [];

      // Update script execution count and timestamp
      script.executionCount++;
      script.lastExecuted = new Date();
    } catch (error) {
      execution.success = false;
      execution.error = error instanceof Error ? error.message : String(error);
      execution.logs.push({
        level: 'error',
        message: execution.error,
        timestamp: new Date(),
        data: [error],
      });

      throw new ExecutionError(`Script execution failed: ${execution.error}`, {
        execution,
        script: script.id,
      });
    } finally {
      execution.duration = Date.now() - startTime;
      this.updateExecutionStats(script.id, execution);
    }

    return execution;
  }

  /**
   * Parse script metadata from userscript header
   */
  async parseMetadata(code: string): Promise<Script['metadata']> {
    return this.parser.parseMetadata(code);
  }

  /**
   * Validate script code for syntax and security issues
   */
  async validateScript(code: string): Promise<ValidationResult> {
    return this.validator.validateScript(code);
  }

  /**
   * Get execution context for a given URL and tab
   */
  async getExecutionContext(url: string): Promise<ExecutionContext> {
    // This would typically get tab info from browser APIs
    // For now, return a basic context
    return {
      url,
      title: 'Unknown',
      tabId: -1,
      frameId: 0,
      gmAPI: await this.gmApiProvider.createAPI({
        url,
        title: 'Unknown',
        tabId: -1,
        frameId: 0,
        gmAPI: {} as any, // Will be filled by provider
        console: console,
      }),
      console: console,
    };
  }

  /**
   * Stop execution of a running script
   */
  async stopExecution(scriptId: string): Promise<void> {
    await this.workerManager.terminateScript(scriptId);
  }

  /**
   * Get execution statistics for a script
   */
  async getExecutionStats(scriptId: string): Promise<ExecutionStats> {
    return (
      this.executionStats.get(scriptId) ?? {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        errorRate: 0,
      }
    );
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(
    scriptId: string,
    execution: ScriptExecution
  ): void {
    const current = this.executionStats.get(scriptId) ?? {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      errorRate: 0,
    };

    current.totalExecutions++;
    if (execution.success) {
      current.successfulExecutions++;
    } else {
      current.failedExecutions++;
    }

    // Update average execution time
    current.averageExecutionTime =
      (current.averageExecutionTime * (current.totalExecutions - 1) +
        execution.duration) /
      current.totalExecutions;

    // Update error rate
    current.errorRate =
      (current.failedExecutions / current.totalExecutions) * 100;
    current.lastExecution = execution;

    this.executionStats.set(scriptId, current);
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.workerManager.dispose();
    this.executionStats.clear();
  }
}
