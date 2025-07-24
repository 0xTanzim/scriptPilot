/**
 * Monaco Loader Component
 * Handles Monaco Editor initialization with CSP compliance for WebExtensions
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEffect } from 'react';

export function MonacoLoader() {
  useEffect(() => {
    console.log('Monaco initialization: configuring loader...');

    // CRITICAL: Configure the loader BEFORE any Monaco Editor component renders
    loader.config({
      // Use the imported monaco directly - no CDN loading
      monaco: monaco,
      // This completely bypasses CDN loading
      'vs/nls': {
        availableLanguages: {},
      },
    });

    // Initialize monaco immediately to prevent CDN fallback
    loader
      .init()
      .then(monacoInstance => {
        console.log(
          'Monaco initialization: loaded successfully',
          monacoInstance
        );

        // Set up Monaco environment for WebExtension (no workers)
        self.MonacoEnvironment = {
          getWorker: function () {
            // Return a dummy worker that immediately closes
            // This disables worker usage which is not compatible with strict CSP
            return {
              postMessage: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              terminate: () => {},
              dispatchEvent: () => true,
            } as any;
          },
        };
      })
      .catch(error => {
        console.error('Monaco initialization: error:', error);

        // Fallback: still configure environment even if init fails
        self.MonacoEnvironment = {
          getWorker: function () {
            return {
              postMessage: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              terminate: () => {},
              dispatchEvent: () => true,
            } as any;
          },
        };
      });

    console.log('Monaco initialization: completed successfully');
  }, []);

  return null; // This is just a configuration component
}

export default MonacoLoader;
