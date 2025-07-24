# GitHub Copilot Instructions for ScriptPilot Development 🤖

## Overview

**ScriptPilot** is an open-source userscript manager built as a `pnpm` monorepo WebExtension, targeting Chrome, Firefox, and Edge. It supports TypeScript, WebAssembly, DevTools integration, plugins, and `chrome.storage.sync`. This guide ensures **GitHub Copilot** accelerates development with **SOLID principles** and FANG-level quality.

## Setup 🚀

1. **Install Copilot**:
   - Install **GitHub Copilot** extension in **VS Code**.
   - Sign in with GitHub and enable Copilot (subscription/trial required).
   - Enable suggestions for TypeScript, JavaScript, and Markdown.
2. **Project Setup**:

   - Clone: `git clone https://github.com/<your-org>/ScriptPilot.git`.
   - Install: `pnpm install`.
   - Configure TypeScript:

     ```json
     {
       "compilerOptions": {
         "target": "ESNext",
         "module": "ESNext",
         "strict": true,
         "noImplicitAny": true,
         "strictNullChecks": true,
         "esModuleInterop": true,
         "moduleResolution": "node",
         "outDir": "./dist",
         "baseUrl": ".",
         "paths": {
           "@ScriptPilot/core": ["packages/core/src/index.ts"],
           "@ScriptPilot/ui": ["packages/ui/src/index.ts"],
           "@ScriptPilot/plugins": ["packages/plugins/src/index.ts"],
           "@ScriptPilot/extension": ["packages/extension/src/index.ts"]
         }
       },
       "include": ["packages/**/*", "apps/**/*", "src/**/*"],
       "exclude": ["node_modules", "dist"]
     }
     ```

3. **VS Code Settings**:
   - Enable Copilot: `"editor.inlineSuggest.enabled": true`.
   - Set Prettier: `"editor.defaultFormatter": "esbenp.prettier-vscode"`.
   - Configure ESLint: `"eslint.validate": ["javascript", "typescript"]`.
   - Enable paths: `"typescript.suggest.paths": true`.

## Best Practices 📝

Adhere to **SOLID principles** for modular, maintainable code.

### 1. Writing Code 🖥️

ScriptPilot uses a `pnpm` monorepo with `@ScriptPilot/core`, `@ScriptPilot/ui`, `@ScriptPilot/plugins`, and `@ScriptPilot/extension`.

- **Core Components (@ScriptPilot/core)**:

  - **Purpose**: Script execution, GM APIs, `dexie` storage.
  - **SOLID**: SRP (execution vs. storage), OCP (extend via plugins).
  - **Prompt Example**: `// TypeScript ScriptService for Web Worker execution with GM APIs`.

    ```typescript
    // packages/core/src/scripts/ScriptService.ts
    import { GM_API } from '@ScriptPilot/core';
    import { v4 as uuidv4 } from 'uuid';

    interface Script {
      id: string;
      code: string;
      metadata: { match: string[]; runAt: 'document-start' | 'document-end' };
    }

    export class ScriptService {
      private worker: Worker;

      constructor() {
        this.worker = new Worker(new URL('./worker.ts', import.meta.url));
      }

      async executeScript(script: Script): Promise<void> {
        this.worker.postMessage({ id: script.id, code: script.code });
        this.worker.onmessage = (event) => {
          console.log(`Script ${script.id} executed:`, event.data);
        };
      }
    }
    ```

  - **Tip**: Use `// Execute userscript with GM_setValue`.

- **GM API Wrappers (@ScriptPilot/core)**:

  - **Purpose**: Type-safe `GM_*` APIs.
  - **SOLID**: ISP (split `GMStorage`, `GMXhr`), DIP (use `inversify`).
  - **Prompt Example**: `// TypeScript GM_API with setValue and xmlHttpRequest`.

    ```typescript
    // packages/core/src/GM_API.ts
    import { injectable } from 'inversify';

    interface GMStorage {
      setValue(key: string, value: any): Promise<void>;
      getValue(key: string, defaultValue?: any): Promise<any>;
    }

    interface GMXhrResponse {
      response: string | ArrayBuffer;
      status: number;
      statusText: string;
    }

    interface GMXhrOptions {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
      headers?: Record<string, string>;
      data?: string | ArrayBuffer;
      responseType?: 'text' | 'arraybuffer' | 'json';
    }

    @injectable()
    export class GM_API implements GMStorage {
      async setValue(key: string, value: any): Promise<void> {
        await chrome.storage.local.set({ [key]: value });
      }

      async getValue(key: string, defaultValue?: any): Promise<any> {
        const result = await chrome.storage.local.get([key]);
        return result[key] ?? defaultValue;
      }

      async xmlHttpRequest(options: GMXhrOptions): Promise<GMXhrResponse> {
        return new Promise((resolve, reject) => {
          fetch(options.url, {
            method: options.method,
            headers: options.headers,
            body: options.data,
          })
            .then(async (response) => {
              const data =
                options.responseType === 'arraybuffer'
                  ? await response.arrayBuffer()
                  : await response.text();
              resolve({
                response: data,
                status: response.status,
                statusText: response.statusText,
              });
            })
            .catch(reject);
        });
      }
    }
    ```

  - **Tip**: Use `// Type-safe GM_xmlhttpRequest wrapper`.

- **UI Components (@ScriptPilot/ui)**:

  - **Purpose**: React components with Tailwind CSS and Monaco Editor.
  - **SOLID**: SRP (UI vs. logic), OCP (extend via plugins).
  - **Prompt Example**: `// React component with Tailwind CSS for script list`.

    ```typescript
    // packages/ui/src/components/ScriptList.tsx
    import React from 'react';
    import { Script } from '@ScriptPilot/core';

    interface ScriptListProps {
      scripts: Script[];
      onToggle: (id: string, enabled: boolean) => void;
    }

    export const ScriptList: React.FC<ScriptListProps> = ({
      scripts,
      onToggle,
    }) => {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Scripts</h2>
          <ul className="space-y-2">
            {scripts.map((script) => (
              <li
                key={script.id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded"
              >
                <span>{script.metadata.name || script.id}</span>
                <input
                  type="checkbox"
                  checked={script.enabled}
                  onChange={() => onToggle(script.id, !script.enabled)}
                  className="h-5 w-5"
                />
              </li>
            ))}
          </ul>
        </div>
      );
    };
    ```

  - **Tip**: Prompt with `// React component with Monaco Editor for script editing`.

- **Plugin System (@ScriptPilot/plugins)**:

  - **Purpose**: Extensibility with TypeScript-based plugins.
  - **SOLID**: OCP (extend core), LSP (interchangeable plugins).
  - **Prompt Example**: `// TypeScript PluginRegistry with register method`.

    ```typescript
    // packages/plugins/src/PluginRegistry.ts
    import { injectable, inject } from 'inversify';
    import { ScriptService } from '@ScriptPilot/core';

    interface Plugin {
      name: string;
      register: (scriptService: ScriptService) => Promise<void>;
    }

    @injectable()
    export class PluginRegistry {
      private plugins: Map<string, Plugin> = new Map();

      constructor(
        @inject('ScriptService') private scriptService: ScriptService
      ) {}

      register(plugin: Plugin): void {
        this.plugins.set(plugin.name, plugin);
        plugin.register(this.scriptService);
      }

      getPlugin(name: string): Plugin | undefined {
        return this.plugins.get(name);
      }
    }
    ```

  - **Tip**: Use `// Plugin for custom GM API`.

### 2. Testing 🧪

- **Purpose**: Ensure 80%+ coverage with Jest and Puppeteer.
- **SOLID**: SRP (focused tests), DIP (mock dependencies).
- **Prompt Example**: `// Jest test for ScriptService`.

  ```typescript
  // packages/core/tests/ScriptService.test.ts
  import { ScriptService } from '@ScriptPilot/core';

  describe('ScriptService', () => {
    it('executes a script in a Web Worker', async () => {
      const scriptService = new ScriptService();
      const script = {
        id: 'test-script',
        code: 'console.log("Hello");',
        metadata: { match: ['*://*.example.com/*'], runAt: 'document-end' },
      };
      jest.spyOn(console, 'log');
      await scriptService.executeScript(script);
      expect(console.log).toHaveBeenCalledWith(
        'Script test-script executed:',
        expect.anything()
      );
    });
  });
  ```

- **Tip**: Prompt with `// Puppeteer test for script injection in Chrome`.

### 3. Documentation ✍️

- **Purpose**: Generate `README.md`, `CONTRIBUTING.md`, etc.
- **Prompt Example**: `// README.md for WebExtension userscript manager`.

  ````markdown
  # ScriptPilot

  **ScriptPilot** is an open-source userscript manager for Chrome, Firefox, and Edge, supporting TypeScript, DevTools, and plugins.

  ## Installation

  ```bash
  git clone https://github.com/<your-org>/ScriptPilot.git
  pnpm install
  pnpm build
  ```
  ````

  ## Usage

  1. Load in Chrome/Firefox (Developer Mode).
  2. Install scripts from GreasyFork or write TypeScript scripts.
  3. Debug with Chrome DevTools.

  ## Features

  - TypeScript/WebAssembly support
  - Plugin system
  - GitHub updates
  - Sync with `chrome.storage.sync`

  ## Contributing

  See [CONTRIBUTING.md](CONTRIBUTING.md).

  ## License

  MIT

  ```

  ```

### Tips for Effective Copilot Use 🌟

- **Specific Prompts**: Use `// TypeScript WebExtension Service Worker for URL matching`.
- **Refine Suggestions**: Add types from `@ScriptPilot/core`, ensure Manifest V3 compliance (no `eval`).
- **Contextual Comments**:

  ```typescript
  // Web Worker for sandboxed userscript execution
  ```

- **Monorepo Imports**: If Copilot fails to resolve `@ScriptPilot/*`:

  ```typescript
  import { ScriptService } from '@ScriptPilot/core'; // from packages/core/src/index.ts
  ```

  - Verify `tsconfig.json` paths.
  - Use `index.ts` exports in each package.
  - Restart VS Code TypeScript server (`Ctrl+Shift+P > Restart TS Server`).

- **Review Code**: Ensure strict CSP and granular permissions.
- **Snippets**: Save GM API wrappers, React components as VS Code snippets.

### Known Limitations ⚠️

- **Monorepo Imports**: Copilot may struggle with `@ScriptPilot/*`. Fix by:
  - Verifying `tsconfig.json` paths.
  - Using `index.ts` exports.
  - Restarting VS Code.
- **WebExtension APIs**: Copilot may suggest Manifest V2 APIs. Use `webextension-polyfill`.
- **Type Safety**: Add interfaces from `@ScriptPilot/core`.
- **Large Files**: Prompt for smaller chunks.

### Example Workflow

1. **Create Script Service**:
   - Prompt: `// TypeScript ScriptService for Web Worker execution`.
   - Place in `packages/core/src/scripts/`.
2. **Build UI Component**:
   - Prompt: `// React component with Monaco Editor`.
   - Place in `packages/ui/src/components/`.
3. **Write Tests**:
   - Prompt: `// Jest test for PluginRegistry`.
   - Place in `packages/plugins/tests/`.
4. **Document Features**:
   - Prompt: `// Markdown guide for ScriptPilot plugins`.
   - Update `docs/plugins.md`.

### Resources 📚

- **GitHub Copilot Docs**: [https://docs.github.com/en/copilot](https://docs.github.com/en/copilot)
- **WebExtensions API**: [https://developer.chrome.com/docs/extensions/](https://developer.chrome.com/docs/extensions/)
- **ScriptPilot Docs**: `docs/installation.md`
- **TypeScript Types**: `@ScriptPilot/core`

Let’s build **ScriptPilot** with Copilot, delivering a modular, extensible, and secure userscript manager! 💪
