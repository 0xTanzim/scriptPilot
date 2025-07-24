import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ScriptPilotUI',
      fileName: format => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Ensure CSS is extracted to a separate file
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') {
            return 'ui.css';
          }
          return assetInfo.name || '';
        },
      },
    },
    sourcemap: true,
    // Extract CSS to external file
    cssCodeSplit: false,
  },
});
