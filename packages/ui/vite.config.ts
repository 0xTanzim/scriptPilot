import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Vite configuration with traditional Tailwind CSS setup
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ScriptPilotUI',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@monaco-editor/react',
        '@scriptpilot/types',
        '@scriptpilot/core',
        'lucide-react',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@monaco-editor/react': 'MonacoEditor',
          'lucide-react': 'LucideReact',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@scriptpilot/types': resolve(__dirname, '../types/src'),
      '@scriptpilot/core': resolve(__dirname, '../core/src'),
    },
  },
  css: {
    devSourcemap: true,
  },
  esbuild: {
    target: 'esnext',
  },
});
