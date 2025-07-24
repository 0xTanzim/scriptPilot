import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Load manifest
const manifest = {
  manifest_version: 3,
  name: 'ScriptPilot',
  version: '0.1.0',
  description:
    'Advanced userscript manager with TypeScript support, DevTools integration, and plugin system',

  permissions: [
    'storage',
    'tabs',
    'activeTab',
    'scripting',
    'unlimitedStorage',
    'webNavigation',
    'contextMenus',
    'notifications',
  ],

  host_permissions: ['http://*/*', 'https://*/*', 'file:///*'],

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
      all_frames: true,
    },
  ],

  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'ScriptPilot',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },

  devtools_page: 'src/devtools/devtools.html',

  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },

  options_page: 'src/popup/popup.html',

  web_accessible_resources: [
    {
      resources: ['src/content/gmapi-injection.js', 'src/popup/popup-init.js'],
      matches: ['http://*/*', 'https://*/*'],
    },
  ],

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
};

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/content/gmapi-injection.js',
          dest: 'src/content',
        },
        {
          src: 'src/popup/popup-init.js',
          dest: 'src/popup',
        },
      ],
    }),
  ],

  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },

  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        devtools: resolve(__dirname, 'src/devtools/devtools.html'),
        panel: resolve(__dirname, 'src/devtools/panel.html'),
      },
    },
    outDir: 'dist',
    sourcemap: true,
    // Ensure CSS is included in the build
    cssCodeSplit: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Extension development server
  server: {
    port: 5173,
    hmr: {
      port: 5174,
    },
  },

  // Optimize deps for WebExtension environment
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'webextension-polyfill',
      '@scriptpilot/core',
      '@scriptpilot/ui',
      '@scriptpilot/storage',
      '@scriptpilot/plugins',
      '@scriptpilot/types',
      'monaco-editor',
      '@monaco-editor/react',
    ],
  },

  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
