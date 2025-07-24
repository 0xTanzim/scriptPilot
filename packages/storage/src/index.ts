// Storage system for ScriptPilot using Dexie + Chrome Storage
export interface StorageService {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export function createStorageService(): StorageService {
  return {
    async get(key: string) {
      // TODO: Implement storage
      return null;
    },
    async set(key: string, value: any) {
      // TODO: Implement storage
    },
    async remove(key: string) {
      // TODO: Implement storage
    },
    async clear() {
      // TODO: Implement storage
    },
  };
}
