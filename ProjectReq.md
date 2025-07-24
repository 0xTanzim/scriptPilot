# Full Project Report for ScriptPilot

## Project Goals

ScriptPilot aims to be the leading open-source userscript manager, surpassing Tampermonkey, Violentmonkey, Greasemonkey, FireMonkey, and ScriptCat with modern development practices, robust security, and a developer-friendly experience inspired by your NextRush and PulseJS frameworks.

- **Cross-Browser Compatibility**: Support Chrome, Firefox, Edge, and optionally Safari using WebExtensions API (Manifest V3).
- **Modern Development Features**: Enable TypeScript, WebAssembly, and multi-file script projects for advanced scripting.
- **Advanced Functionality**: Include DevTools integration, a plugin system, GitHub script updates, and enterprise-grade features (audit logs, domain restrictions).
- **User Experience**: Provide an intuitive React-based UI with Monaco Editor for beginners and power users, addressing Greasemonkey’s basic UI [].
- **Performance & Security**: Ensure lightweight operation with sandboxed Web Worker execution, mitigating Tampermonkey’s security concerns [].
- **Open-Source Community**: Release under MIT license to foster contributions, similar to Violentmonkey [].
- **Cost-Efficiency**: Use `dexie` for local storage and `chrome.storage.sync` for cross-device sync, avoiding Firebase costs.

## Project Specifications

- **Platform**: WebExtension (Manifest V3) for Chrome, Firefox, Edge, and optionally Safari.
- **Features**:
  - Script management (install, enable/disable, edit).
  - TypeScript and WebAssembly support.
  - DevTools integration for debugging.
  - Plugin system for extensibility.
  - GitHub integration for script updates.
  - Script marketplace with ratings and changelogs.
  - Enterprise features (audit logs, domain restrictions).
  - Cross-device sync via `chrome.storage.sync`.
  - ZIP/JSON import/export for backups.
- **Technology Stack**:
  - **Frontend**: React, Tailwind CSS, `@monaco-editor/react`.
  - **Core Engine**: WebExtensions API, Service Workers, Web Workers.
  - **Storage**: `dexie` (IndexedDB), `chrome.storage.sync`.
  - **Build Tools**: Vite, `esbuild`, TypeScript.
  - **Package Manager**: `pnpm` workspace.
- **Code Quality**:
  - TypeScript (strict mode: `noImplicitAny`, `strictNullChecks`).
  - ESLint (Airbnb style), Prettier.
  - 80%+ test coverage with Jest (unit) and Puppeteer (E2E).
  - Comprehensive documentation (`README.md`, `CONTRIBUTING.md`, etc.).

## Architectural Design

ScriptPilot’s architecture is modular, scalable, and secure, designed for millions of users while addressing Violentmonkey’s Vue.js bloat and Greasemonkey’s Firefox-only limitations [].

### High-Level Architecture

1. **Popup UI**: React-based interface with Tailwind CSS and Monaco Editor for script management and TypeScript editing.
2. **Service Worker (Background)**: Handles URL matching, GitHub updates, and storage sync.
3. **Content Script**: Injects scripts via Web Workers for sandboxed execution.
4. **Storage Layer**: `dexie` for local script storage, `chrome.storage.sync` for settings.
5. **Plugin System**: TypeScript-based registry for custom APIs and UI panels.

### Architectural Diagram

```mermaid
graph TD
    A[Browser] --> B[ScriptPilot Extension]
    B --> C[Popup UI (React + Tailwind)]
    B --> D[Service Worker (Background)]
    B --> E[Content Script]
    C --> F[Monaco Editor (TypeScript)]
    C --> G[IndexedDB (Dexie)]
    C --> H[Chrome Storage Sync]
    D --> I[URL Matcher]
    D --> J[GitHub Update Checker]
    D --> G
    D --> H
    E --> K[Web Worker (Script Execution)]
    K --> L[GM_* API Wrappers]
    F --> M[ESLint/Prettier]
    K --> N[DevTools Integration]
    C --> O[Plugin Registry]
```

**Explanation**:

- **Popup UI**: Manages scripts with a responsive interface and Monaco Editor.
- **Service Worker**: Performs background tasks (URL matching, updates).
- **Content Script**: Executes scripts securely in Web Workers.
- **Storage**: Uses `dexie` for local storage, `chrome.storage.sync` for sync.
- **Plugins**: Extends functionality via a registry, inspired by PulseJS [].

### Code Quality Standards

- **TypeScript**: Strict mode for type safety, zero `any` usage.
- **Linting & Formatting**: ESLint (Airbnb), Prettier, enforced via GitHub Actions.
- **Testing**: 80%+ coverage with Jest (unit) and Puppeteer (E2E), including DevTools integration tests.
- **Documentation**: Detailed `README.md`, `CONTRIBUTING.md`, `PLUGINS.md`, and API docs.
- **Code Reviews**: Pull requests with CI checks for quality.

### Design Patterns

- **SOLID Principles**:
  - **Single Responsibility**: `ScriptService` for execution, `StorageService` for data, `PluginRegistry` for plugins.
  - **Open/Closed**: Plugins extend functionality without modifying core.
  - **Liskov Substitution**: Plugins implement a `Plugin` interface, interchangeable with `PluginRegistry`.
  - **Interface Segregation**: Split GM APIs into `GMStorage`, `GMXhr`.
  - **Dependency Inversion**: Use `inversify` for DI (e.g., inject `StorageService` into `ScriptService`).
- **Patterns**:
  - **Adapter**: Abstract browser APIs (e.g., `chrome.storage`).
  - **Strategy**: Support multiple URL matching strategies (regex, `micromatch`).
  - **Observer**: Use `EventEmitter` for script execution events.
  - **Factory**: Create script/plugin instances dynamically.
  - **Decorator**: Add logging/validation to GM APIs.

### NPM Packages

- **Core UI**: `react`, `react-dom`, `tailwindcss` , `@monaco-editor/react` .
- **Build Tools**: `vite` , `esbuild` (0.x), `typescript` (5.x), `@crxjs/vite-plugin` (2.x), `webextension-polyfill` (0.x).
- **Storage**: `dexie` (3.x), `chrome.storage.sync` (via `webextension-polyfill`).
- **Testing**: `jest` (29.x), `puppeteer` (22.x), `@testing-library/react` (14.x).
- **Utilities**: `zod` (3.x), `lodash-es` (4.x), `uuid` (9.x), `content-security-policy` (0.x).
- **Linting**: `eslint` (8.x), `prettier` (3.x), `@typescript-eslint/parser` (6.x).

**Why These Packages?**

- **React + Tailwind**: Fast, reusable UI, avoiding Violentmonkey’s Vue.js bloat [].
- **Monaco Editor**: TypeScript support and debugging, surpassing competitors [].
- **Vite + esbuild**: Fast builds, aligning with NextRush performance focus [].
- **Dexie + Chrome Sync**: Cost-efficient storage/sync, replacing Firebase.
- **Jest + Puppeteer**: Robust testing, FANG-level reliability.

### PNPM Workspace Setup

```yaml
packages:
  - 'packages/core'
  - 'packages/ui'
  - 'packages/plugins'
  - 'packages/extension'
  - 'apps/extension'
```

#### Folder Structure

```
ScriptPilot/
├── apps/
│   └── extension/
│       ├── src/
│       │   ├── manifest.json
│       │   ├── background.ts
│       │   └── content.ts
│       ├── build.ts
│       ├── tests/
│       └── package.json
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── scripts/
│   │   │   │   ├── ScriptService.ts
│   │   │   │   └── GM_API.ts
│   │   │   ├── storage/
│   │   │   │   └── StorageService.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   ├── ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ScriptList.tsx
│   │   │   ├── pages/
│   │   │   │   └── Popup.tsx
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   ├── plugins/
│   │   ├── src/
│   │   │   ├── PluginRegistry.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
├── configs/
├── .vscode/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── eslintrc.js
└── prettier.config.js
```

## Implementation Blueprint

### Phase 1: R&D + Prototype (4–6 Weeks)

- **Tasks**:
  - Initialize `pnpm` workspace with above structure.
  - Implement `@ScriptPilot/core` with `ScriptService`, `GM_API`, and `StorageService`.
  - Build script injection using Web Workers and `chrome.scripting`.
  - Develop React popup with Tailwind CSS and Monaco Editor.
  - Configure ESLint, Prettier, Jest, and Puppeteer.
  - Set up GitHub Actions for CI/CD.
- **Deliverables**:
  - Basic WebExtension with script execution for `@match` URLs.
  - React popup for script management.
  - TypeScript GM API wrappers.
- **Sample Code**: ScriptService

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

### Phase 2: MVP Release (8–12 Weeks)

- **Tasks**:
  - Enhance popup with script enable/disable, metadata parsing, and ZIP import/export.
  - Add Monaco Editor with TypeScript linting and autocomplete.
  - Implement `chrome.storage.sync` for cross-device settings.
  - Support one-click installs from GreasyFork/OpenUserJS.
  - Add plugin system with `PluginRegistry`.
  - Achieve 80%+ test coverage.
  - Submit beta to Chrome Web Store/Firefox Add-ons.
- **Deliverables**:
  - Functional userscript manager with editor, sync, and plugins.
  - Beta release on Chrome Web Store/Firefox Add-ons.

### Phase 3: Power Features (12–16 Weeks)

- **Tasks**:
  - Integrate DevTools for script debugging.
  - Add TypeScript/WebAssembly compilation with `esbuild`.
  - Implement GitHub updates via `@updateURL`.
  - Build in-extension marketplace with ratings.
  - Add enterprise features (audit logs, domain restrictions).
  - Develop optional GitHub Gist sync plugin.
- **Deliverables**:
  - Advanced userscript manager on GitHub.
  - Full release on Chrome Web Store/Firefox Add-ons.

## Best Practices

- **Performance**: Lazy-load UI, cache URL patterns, use zero-copy transfers for Web Workers.
- **Security**: Strict CSP, sandboxed Web Workers, granular permissions.
- **Accessibility**: Keyboard navigation, ARIA compliance.
- **Internationalization**: Support English/Chinese, i18n hooks.
- **Community**: Promote on r/firefox, r/Chrome, GreasyFork.

## Competitive Matrix

| **Feature**             | **Tampermonkey**              | **Violentmonkey**            | **Greasemonkey** | **FireMonkey** | **ScriptCat** | **ScriptPilot**               |
| ----------------------- | ----------------------------- | ---------------------------- | ---------------- | -------------- | ------------- | ----------------------------- |
| **Open-Source**         | No                            | Yes (MIT)                    | Yes (MIT)        | Yes (MPL-2.0)  | Yes           | Yes (MIT)                     |
| **Cross-Browser**       | Chrome, Firefox, Edge, Safari | Chrome, Firefox, Edge, Opera | Firefox          | Firefox        | Chrome, Edge  | Chrome, Firefox, Edge, Safari |
| **TypeScript/WASM**     | No                            | No                           | No               | No             | No            | Yes                           |
| **DevTools Debugging**  | No                            | No                           | No               | No             | No            | Yes                           |
| **Plugin System**       | No                            | No                           | No               | No             | No            | Yes                           |
| **GitHub Integration**  | No                            | No                           | No               | No             | No            | Yes                           |
| **Sync**                | Yes (slow)                    | Yes (Dropbox)                | No               | No             | Yes           | Yes (Chrome Sync)             |
| **Enterprise Features** | No                            | No                           | No               | No             | No            | Yes                           |

## Real-Life Example (FANG-Level)

- **Google’s DevTools**: ScriptPilot’s debugging mirrors Google’s real-time UI testing [].
- **Meta’s Automation**: Sandboxed execution and audit logs match Meta’s secure policies [].
- **GitHub Updates**: Similar to GitHub’s repo-linked internal tools [].

## Actionable Steps

1. **Initialize Project**:
   - Create GitHub repo with MIT license and `pnpm-workspace.yaml`.
   - Set up GitHub Actions for CI/CD.
2. **Develop Core**:
   - Build `@ScriptPilot/core` with `ScriptService`, `GM_API`, `StorageService`.
   - Implement Web Worker injection.
3. **Build UI**:
   - Develop `@ScriptPilot/ui` with React, Tailwind, Monaco Editor.
   - Add script management/editing.
4. **Test and Deploy**:
   - Write Jest/Puppeteer tests (80%+ coverage).
   - Submit beta to Chrome Web Store/Firefox Add-ons.
5. **Engage Community**:
   - Promote on r/firefox, GreasyFork, Discord.
   - Invite plugin/theme contributions.
