// Plugin system for ScriptPilot extensibility
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  // Add plugin interfaces here
}

export function createPlugin(plugin: Plugin): Plugin {
  return plugin;
}
