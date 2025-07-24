import type { Script, ScriptExecution } from '@scriptpilot/types';
import Dexie, { Table } from 'dexie';

/**
 * Extended script execution with database ID
 */
export interface ScriptExecutionRecord extends ScriptExecution {
  /** Database ID */
  id: string;
  /** Execution status */
  status: 'success' | 'error' | 'timeout';
}

/**
 * Script database schema for IndexedDB
 */
export interface ScriptDB {
  scripts: Table<Script, string>;
  executions: Table<ScriptExecutionRecord, string>;
}

/**
 * Dexie database for managing scripts and execution history
 */
export class ScriptDatabase extends Dexie implements ScriptDB {
  scripts!: Table<Script, string>;
  executions!: Table<ScriptExecutionRecord, string>;

  constructor() {
    super('ScriptPilotScripts');

    this.version(1).stores({
      scripts:
        'id, metadata.name, enabled, metadata.author, metadata.namespace, metadata.version, installedAt, updatedAt, lastExecuted',
      executions: 'id, scriptId, timestamp, status, duration',
    });

    // Add hooks for automatic timestamp updates
    this.scripts.hook('creating', (primKey, obj, trans) => {
      if (!obj.updatedAt) {
        obj.updatedAt = new Date();
      }
    });

    this.scripts.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.executions.hook('creating', (primKey, obj, trans) => {
      if (!obj.timestamp) {
        obj.timestamp = new Date();
      }
      if (!obj.id) {
        obj.id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      if (!obj.status) {
        obj.status = obj.success ? 'success' : 'error';
      }
    });
  }

  /**
   * Get script by ID
   */
  async getScript(id: string): Promise<Script | null> {
    try {
      const script = await this.scripts.get(id);
      return script || null;
    } catch (error) {
      console.error(`Failed to get script ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all scripts
   */
  async getAllScripts(): Promise<Script[]> {
    try {
      return await this.scripts.orderBy('name').toArray();
    } catch (error) {
      console.error('Failed to get all scripts:', error);
      return [];
    }
  }

  /**
   * Save or update script
   */
  async saveScript(script: Script): Promise<void> {
    try {
      await this.scripts.put(script);
    } catch (error) {
      console.error(`Failed to save script ${script.id}:`, error);
      throw error;
    }
  }

  /**
   * Update script with partial data
   */
  async updateScript(id: string, updates: Partial<Script>): Promise<void> {
    try {
      await this.scripts.update(id, updates);
    } catch (error) {
      console.error(`Failed to update script ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete script and its execution history
   */
  async deleteScript(id: string): Promise<void> {
    try {
      await this.transaction(
        'rw',
        [this.scripts, this.executions],
        async () => {
          await this.scripts.delete(id);
          await this.executions.where('scriptId').equals(id).delete();
        }
      );
    } catch (error) {
      console.error(`Failed to delete script ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search scripts by name, author, or description
   */
  async searchScripts(query: string): Promise<Script[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return await this.scripts
        .filter(
          script =>
            (script.metadata.name?.toLowerCase().includes(lowerQuery) ??
              false) ||
            (script.metadata.author?.toLowerCase().includes(lowerQuery) ??
              false) ||
            (script.metadata.description?.toLowerCase().includes(lowerQuery) ??
              false)
        )
        .toArray();
    } catch (error) {
      console.error(`Failed to search scripts with query "${query}":`, error);
      return [];
    }
  }

  /**
   * Get scripts that match a specific domain
   */
  async getScriptsByDomain(domain: string): Promise<Script[]> {
    try {
      return await this.scripts
        .filter(script => {
          return script.metadata.match.some(pattern => {
            // Simple pattern matching - can be enhanced
            if (pattern === '*') return true;
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              return regex.test(domain);
            }
            return pattern.includes(domain);
          });
        })
        .toArray();
    } catch (error) {
      console.error(`Failed to get scripts for domain ${domain}:`, error);
      return [];
    }
  }

  /**
   * Get only enabled scripts
   */
  async getEnabledScripts(): Promise<Script[]> {
    try {
      return await this.scripts.where('enabled').equals(1).toArray();
    } catch (error) {
      console.error('Failed to get enabled scripts:', error);
      return [];
    }
  }

  /**
   * Get scripts by author
   */
  async getScriptsByAuthor(author: string): Promise<Script[]> {
    try {
      return await this.scripts
        .filter(script => script.metadata.author === author)
        .toArray();
    } catch (error) {
      console.error(`Failed to get scripts by author ${author}:`, error);
      return [];
    }
  }

  /**
   * Get scripts updated after a specific date
   */
  async getScriptsUpdatedAfter(date: Date): Promise<Script[]> {
    try {
      return await this.scripts.where('updatedAt').above(date).toArray();
    } catch (error) {
      console.error('Failed to get recently updated scripts:', error);
      return [];
    }
  }

  /**
   * Save script execution
   */
  async saveExecution(execution: ScriptExecution): Promise<void> {
    try {
      const record: ScriptExecutionRecord = {
        ...execution,
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: execution.success ? 'success' : 'error',
      };
      await this.executions.put(record);

      // Update script's lastExecuted timestamp
      await this.scripts.update(execution.scriptId, {
        lastExecuted: execution.timestamp,
      });
    } catch (error) {
      console.error(
        `Failed to save execution for script ${execution.scriptId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get execution history for a script
   */
  async getExecutionHistory(
    scriptId: string,
    limit = 100
  ): Promise<ScriptExecution[]> {
    try {
      return await this.executions
        .where('scriptId')
        .equals(scriptId)
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error(
        `Failed to get execution history for script ${scriptId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Clear execution history for a script
   */
  async clearExecutionHistory(scriptId: string): Promise<void> {
    try {
      await this.executions.where('scriptId').equals(scriptId).delete();
    } catch (error) {
      console.error(
        `Failed to clear execution history for script ${scriptId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get execution statistics for a script
   */
  async getExecutionStats(scriptId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: ScriptExecution;
  }> {
    try {
      const executions = await this.executions
        .where('scriptId')
        .equals(scriptId)
        .toArray();

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(
        e => e.status === 'success'
      ).length;
      const failedExecutions = executions.filter(
        e => e.status === 'error'
      ).length;

      const averageExecutionTime =
        executions.length > 0
          ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) /
            executions.length
          : 0;

      const lastExecution = executions.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )[0];

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime,
        lastExecution,
      };
    } catch (error) {
      console.error(
        `Failed to get execution stats for script ${scriptId}:`,
        error
      );
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
      };
    }
  }

  /**
   * Clean up old execution history
   */
  async cleanupOldExecutions(
    olderThanDays = 30,
    maxExecutionsPerScript = 100
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Delete old executions
      await this.executions.where('timestamp').below(cutoffDate).delete();

      // Keep only the latest N executions per script
      const scripts = await this.scripts.toArray();

      for (const script of scripts) {
        const executions = await this.executions
          .where('scriptId')
          .equals(script.id)
          .reverse()
          .toArray();

        if (executions.length > maxExecutionsPerScript) {
          const toDelete = executions.slice(maxExecutionsPerScript);
          const idsToDelete = toDelete.map((e: ScriptExecutionRecord) => e.id);
          await this.executions.bulkDelete(idsToDelete);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old executions:', error);
      throw error;
    }
  }

  /**
   * Export all scripts and execution data
   */
  async exportData(): Promise<{
    scripts: Script[];
    executions: ScriptExecution[];
    exportedAt: Date;
  }> {
    try {
      const [scripts, executions] = await Promise.all([
        this.scripts.toArray(),
        this.executions.toArray(),
      ]);

      return {
        scripts,
        executions,
        exportedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to export script data:', error);
      throw error;
    }
  }

  /**
   * Import scripts and execution data
   */
  async importData(data: {
    scripts: Script[];
    executions?: ScriptExecution[];
  }): Promise<void> {
    try {
      await this.transaction(
        'rw',
        [this.scripts, this.executions],
        async () => {
          // Import scripts
          await this.scripts.bulkPut(data.scripts);

          // Import executions if provided
          if (data.executions) {
            const executionRecords: ScriptExecutionRecord[] =
              data.executions.map(execution => ({
                ...execution,
                id: crypto.randomUUID(),
                status: execution.success ? 'success' : 'error',
              }));
            await this.executions.bulkPut(executionRecords);
          }
        }
      );
    } catch (error) {
      console.error('Failed to import script data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalScripts: number;
    enabledScripts: number;
    totalExecutions: number;
    lastExecution?: Date;
    databaseSize: number;
  }> {
    try {
      const [
        totalScripts,
        enabledScripts,
        totalExecutions,
        lastExecutionRecord,
      ] = await Promise.all([
        this.scripts.count(),
        this.scripts.where('enabled').equals(1).count(),
        this.executions.count(),
        this.executions.orderBy('timestamp').reverse().first(),
      ]);

      // Estimate database size
      let databaseSize = 0;
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        databaseSize = estimate.usage || 0;
      }

      return {
        totalScripts,
        enabledScripts,
        totalExecutions,
        lastExecution: lastExecutionRecord?.timestamp,
        databaseSize,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalScripts: 0,
        enabledScripts: 0,
        totalExecutions: 0,
        databaseSize: 0,
      };
    }
  }
}

/**
 * Singleton instance of the script database
 */
let scriptDatabase: ScriptDatabase | null = null;

/**
 * Get the script database instance
 */
export function getScriptDatabase(): ScriptDatabase {
  if (!scriptDatabase) {
    scriptDatabase = new ScriptDatabase();
  }
  return scriptDatabase;
}

/**
 * Close the script database
 */
export async function closeScriptDatabase(): Promise<void> {
  if (scriptDatabase) {
    await scriptDatabase.close();
    scriptDatabase = null;
  }
}
