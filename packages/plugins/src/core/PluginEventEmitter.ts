import type { PluginEventEmitter } from '@scriptpilot/types';

/**
 * Event emitter for plugin communication
 */
export class PluginEventEmitterImpl implements PluginEventEmitter {
  private listeners: Map<string, Array<(...args: unknown[]) => void>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to events
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
      
      // Clean up empty event arrays
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit events
   */
  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy to avoid issues if listeners modify the array
      const listeners = [...eventListeners];
      for (const listener of listeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe once (auto-unsubscribe after first call)
   */
  once(event: string, listener: (...args: unknown[]) => void): void {
    const onceWrapper = (...args: unknown[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get list of events with listeners
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * Get listeners for an event
   */
  getListeners(event: string): Array<(...args: unknown[]) => void> {
    return this.listeners.get(event) || [];
  }

  /**
   * Check if event has listeners
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }
}
