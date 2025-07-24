# ScriptPilot 🚀

**ScriptPilot** is a modern, open-source userscript manager for Chrome, Firefox, and Edge. Built
with TypeScript, React, and cutting-edge web technologies, it offers advanced features like DevTools
integration, plugin system, and TypeScript/WebAssembly support.

## ✨ Features

- 🌐 **Cross-Browser Support**: Chrome, Firefox, Edge (Manifest V3)
- 🛠️ **TypeScript & WebAssembly**: Advanced script development
- 🎨 **Modern UI**: React + Tailwind CSS with Monaco Editor
- 🔧 **DevTools Integration**: Debug scripts like a pro
- 🧩 **Plugin System**: Extensible architecture
- 🔄 **GitHub Updates**: Automatic script updates
- ☁️ **Cross-Device Sync**: Chrome Storage Sync
- 🔒 **Secure**: Sandboxed Web Worker execution
- 📊 **Enterprise Ready**: Audit logs, domain restrictions

## 🏗️ Architecture

This project uses a **Turborepo** monorepo structure:

```plaintext
ScriptPilot/
├── apps/
│   └── extension/          # WebExtension app
├── packages/
│   ├── core/              # Script execution & GM APIs
│   ├── ui/                # React UI components
│   ├── storage/           # Dexie + Chrome Storage
│   ├── plugins/           # Plugin system
│   └── types/             # TypeScript definitions
├── turbo.json             # Turborepo configuration
└── package.json           # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/0xTanzim/scriptPilot.git
cd scriptPilot

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Load Extension

1. **Chrome/Edge**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select `apps/extension/dist`

2. **Firefox**:
   - Go to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select `apps/extension/dist/manifest.json`

## 📦 Package Overview

### `@scriptpilot/core`

Core script execution engine with GM API wrappers and Web Worker sandboxing.

### `@scriptpilot/ui`

React components with Tailwind CSS and Monaco Editor for script management.

### `@scriptpilot/storage`

Storage layer using Dexie (IndexedDB) and Chrome Storage Sync.

### `@scriptpilot/plugins`

Plugin system with TypeScript-based registry for extensibility.

### `@scriptpilot/types`

Shared TypeScript types and interfaces.

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all packages in development mode
pnpm build            # Build all packages
pnpm test             # Run tests across all packages
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages
pnpm clean            # Clean all build artifacts
```

### Package Scripts

```bash
# Work on specific packages
cd packages/core
pnpm dev              # Watch mode for core package
pnpm test             # Test core package only

cd packages/ui
pnpm dev              # Start UI development server
```

## 🧪 Testing

- **Unit Tests**: Jest for all packages
- **E2E Tests**: Puppeteer for extension testing
- **Coverage**: 80%+ target across codebase

```bash
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
```

## 🎯 Roadmap

### Phase 1: MVP (Current)

- [x] Turborepo setup
- [ ] Core script execution
- [ ] Basic React UI
- [ ] Storage layer
- [ ] Plugin system

### Phase 2: Advanced Features

- [ ] DevTools integration
- [ ] TypeScript compilation
- [ ] GitHub updates
- [ ] Marketplace

### Phase 3: Enterprise

- [ ] Audit logs
- [ ] Domain restrictions
- [ ] Team management

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Inspired by existing userscript managers (Tampermonkey, Violentmonkey)
- Built with modern web technologies and best practices
- Designed for the next generation of userscript development

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/ScriptPilot/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/ScriptPilot/discussions)
- 📧 **Email**: <support@scriptpilot.dev>

---

### Made with ❤️ by the ScriptPilot team
