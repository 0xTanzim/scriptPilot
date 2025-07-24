import type { Script } from '@scriptpilot/types';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { AppRouter } from './AppRouter';
import { DraggableDevTools } from './components/DraggableDevTools';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * DEVELOPMENT WRAPPER - DevApp.tsx
 *
 * 🎯 PURPOSE: This is a DEVELOPMENT-ONLY wrapper that provides:
 * - Mock data for testing
 * - Development tools overlay
 * - Hot reloading for UI development
 *
 * 📚 ARCHITECTURE EXPLANATION:
 *
 * DevApp.tsx (This file) - Development wrapper with mock data
 *     ↓
 * AppRouter.tsx - Clean routing with Context Provider pattern
 *     ↓
 * CleanApp.tsx - Main application using modern React patterns
 *     ↓
 * Layout Components - ScriptLayout, ScriptHeader, ScriptNavigation, ScriptContent
 *
 * 🚫 NOTE: DevApp is NOT used in production!
 * Production uses AppRouter directly with real data from the extension.
 */
export function DevApp() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl] = useState('https://example.com');
  const [mode, setMode] = useState<'popup' | 'fullscreen'>('fullscreen');

  // Refs for advanced React patterns
  const appContainerRef = useRef<HTMLDivElement>(null);
  const toastPortalRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Mock script data for development - memoized to prevent re-renders
  const mockScripts = useMemo<Script[]>(
    () => [
      {
        id: 'dev-script-1',
        code: `// ==UserScript==
// @name         GitHub Dark Mode Enhanced
// @namespace    scriptpilot.github
// @version      1.2.0
// @description  Enhanced dark mode for GitHub with custom styling
// @author       ScriptPilot Dev
// @match        https://github.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Add custom dark theme
    GM_addStyle(\`
        body {
            background: #0d1117 !important;
            color: #c9d1d9 !important;
        }
        .Header { background: #161b22 !important; }
    \`);

    console.log('GitHub Dark Mode Enhanced loaded!');
})();`,
        metadata: {
          name: 'GitHub Dark Mode Enhanced',
          namespace: 'scriptpilot.github',
          version: '1.2.0',
          description: 'Enhanced dark mode for GitHub with custom styling',
          author: 'ScriptPilot Dev',
          match: ['https://github.com/*'],
          grant: ['GM_addStyle'],
          runAt: 'document-start',
        },
        enabled: true,
        installedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        source: 'manual',
        size: 1024,
        executionCount: 42,
        tags: ['github', 'dark-mode', 'ui'],
      },
      {
        id: 'dev-script-2',
        code: `// ==UserScript==
// @name         YouTube Ad Blocker Pro
// @namespace    scriptpilot.youtube
// @version      2.5.0
// @description  Advanced ad blocking for YouTube with analytics
// @author       ScriptPilot Dev
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let blockedAds = 0;

    // Block ads function
    function blockAds() {
        const ads = document.querySelectorAll('.ytd-promoted-sparkles-web-renderer');
        ads.forEach(ad => {
            ad.remove();
            blockedAds++;
        });

        if (blockedAds > 0) {
            GM_setValue('blockedAds', blockedAds);
            console.log(\`Blocked \${blockedAds} ads on YouTube\`);
        }
    }

    // Run every 2 seconds
    setInterval(blockAds, 2000);

    // Initial run
    blockAds();
})();`,
        metadata: {
          name: 'YouTube Ad Blocker Pro',
          namespace: 'scriptpilot.youtube',
          version: '2.5.0',
          description: 'Advanced ad blocking for YouTube with analytics',
          author: 'ScriptPilot Dev',
          match: ['https://www.youtube.com/*'],
          grant: ['GM_getValue', 'GM_setValue', 'GM_notification'],
          runAt: 'document-idle',
        },
        enabled: false,
        installedAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10'),
        source: 'manual',
        size: 2048,
        executionCount: 128,
        tags: ['youtube', 'ads', 'blocker'],
      },
      {
        id: 'dev-script-3',
        code: `// ==UserScript==
// @name         Twitter/X Enhancer
// @namespace    scriptpilot.twitter
// @version      1.0.0
// @description  Enhanced Twitter/X experience with custom features
// @author       ScriptPilot Dev
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Custom styles for better readability
    GM_addStyle(\`
        [data-testid="primaryColumn"] {
            max-width: 800px !important;
            margin: 0 auto !important;
        }
        article {
            border-radius: 12px !important;
            margin-bottom: 16px !important;
        }
    \`);

    // Add custom features
    console.log('Twitter/X Enhancer loaded!');
})();`,
        metadata: {
          name: 'Twitter/X Enhancer',
          namespace: 'scriptpilot.twitter',
          version: '1.0.0',
          description: 'Enhanced Twitter/X experience with custom features',
          author: 'ScriptPilot Dev',
          match: ['https://twitter.com/*', 'https://x.com/*'],
          grant: ['GM_addStyle', 'GM_xmlhttpRequest'],
          runAt: 'document-end',
        },
        enabled: true,
        installedAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
        source: 'manual',
        size: 1536,
        executionCount: 24,
        tags: ['twitter', 'social', 'enhancer'],
      },
    ],
    []
  );

  // Initialize app with useLayoutEffect for synchronous setup
  useLayoutEffect(() => {
    if (!initialized.current) {
      console.log('[ScriptPilot Dev] Initializing development environment...');

      // Detect mode based on URL hash and window size (but prefer fullscreen for development)
      const detectMode = () => {
        // Always use fullscreen for development unless specifically in popup mode
        const isFullscreen =
          window.innerWidth > 400 || window.location.hash.includes('editor');
        setMode(isFullscreen ? 'fullscreen' : 'fullscreen'); // Force fullscreen for better development experience
      };

      detectMode();
      window.addEventListener('resize', detectMode);

      initialized.current = true;

      return () => {
        window.removeEventListener('resize', detectMode);
      };
    }
  }, []);

  // Load mock data with useEffect
  useEffect(() => {
    const loadMockData = async () => {
      setIsLoading(true);

      // Simulate API loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Clear any corrupted data first (for development)
      const shouldClearStorage =
        localStorage.getItem('scriptpilot-dev-version') !== '1.0.0';
      if (shouldClearStorage) {
        localStorage.removeItem('scriptpilot-dev-scripts');
        localStorage.setItem('scriptpilot-dev-version', '1.0.0');
        console.log('[ScriptPilot Dev] Cleared old localStorage data');
      }

      // Load from localStorage if available, otherwise use mock data
      const savedScripts = localStorage.getItem('scriptpilot-dev-scripts');
      if (savedScripts) {
        try {
          const parsed = JSON.parse(savedScripts);
          // Convert date strings back to Date objects
          const scriptsWithDates = parsed.map(
            (script: Script & { installedAt: string; updatedAt: string }) => ({
              ...script,
              installedAt: new Date(script.installedAt),
              updatedAt: new Date(script.updatedAt),
            })
          );
          setScripts(scriptsWithDates);
          console.log(
            '[ScriptPilot Dev] Loaded scripts from localStorage:',
            scriptsWithDates.length
          );
        } catch {
          console.warn(
            '[ScriptPilot Dev] Failed to parse saved scripts, using mock data'
          );
          setScripts(mockScripts);
        }
      } else {
        setScripts(mockScripts);
        console.log('[ScriptPilot Dev] Using initial mock data');
      }

      setIsLoading(false);
    };

    loadMockData();
  }, [mockScripts]);

  // Save scripts to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && scripts.length > 0) {
      localStorage.setItem('scriptpilot-dev-scripts', JSON.stringify(scripts));
      console.log('[ScriptPilot Dev] Saved scripts to localStorage');
    }
  }, [scripts, isLoading]);

  // Advanced callback handlers with useCallback for performance
  const handleScriptSave = useCallback(async (script: Script) => {
    console.log('[ScriptPilot Dev] Saving script:', script.metadata.name);

    setScripts(prev => {
      const existing = prev.find(s => s.id === script.id);
      if (existing) {
        // Update existing script
        return prev.map(s =>
          s.id === script.id ? { ...script, updatedAt: new Date() } : s
        );
      } else {
        // Add new script
        return [
          ...prev,
          { ...script, installedAt: new Date(), updatedAt: new Date() },
        ];
      }
    });

    toast.success(`Script "${script.metadata.name}" saved successfully!`);
  }, []);

  const handleScriptDelete = useCallback(
    async (scriptId: string) => {
      console.log('[ScriptPilot Dev] Deleting script:', scriptId);

      const script = scripts.find(s => s.id === scriptId);
      if (script) {
        setScripts(prev => prev.filter(s => s.id !== scriptId));
        toast.success(`Script "${script.metadata.name}" deleted!`);
      }
    },
    [scripts]
  );

  const handleScriptToggle = useCallback(
    async (scriptId: string, enabled: boolean) => {
      console.log('[ScriptPilot Dev] Toggling script:', scriptId, enabled);

      setScripts(prev =>
        prev.map(s =>
          s.id === scriptId ? { ...s, enabled, updatedAt: new Date() } : s
        )
      );

      const script = scripts.find(s => s.id === scriptId);
      if (script) {
        toast.info(
          `Script "${script.metadata.name}" ${enabled ? 'enabled' : 'disabled'}`
        );
      }
    },
    [scripts]
  );

  const handleScriptInstall = useCallback(async (url: string) => {
    console.log('[ScriptPilot Dev] Installing script from URL:', url);
    toast.info('Script installation feature coming soon in development mode!');
  }, []);

  const handleOpenSettings = useCallback(() => {
    console.log('[ScriptPilot Dev] Opening settings...');
    window.location.hash = '#settings';
  }, []);

  const handleOpenEditor = useCallback((scriptId?: string) => {
    console.log('[ScriptPilot Dev] Opening editor for script:', scriptId);
    if (scriptId) {
      window.location.hash = `#editor/${scriptId}`;
    } else {
      window.location.hash = '#editor';
    }
  }, []);

  // Create portal for draggable development tools
  const devToolsPortal =
    toastPortalRef.current &&
    createPortal(
      <DraggableDevTools
        mode={mode}
        scripts={scripts}
        currentUrl={currentUrl}
        onReset={() => {
          localStorage.removeItem('scriptpilot-dev-scripts');
          localStorage.removeItem('scriptpilot-dev-version');
          setScripts(mockScripts);
          toast.info('Reset to mock data!');
        }}
      />,
      toastPortalRef.current
    );

  if (isLoading) {
    return (
      <div className='h-screen flex items-center justify-center bg-background'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto'></div>
          <h2 className='text-xl font-semibold'>Loading ScriptPilot...</h2>
          <p className='text-muted-foreground'>
            Setting up development environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main App Container with ref and Error Boundary */}
      <div ref={appContainerRef} className='h-screen w-full'>
        <ErrorBoundary>
          <AppRouter
            scripts={scripts}
            currentUrl={currentUrl}
            currentTitle='ScriptPilot Development'
            scriptStatus={scripts.map(s => ({ enabled: s.enabled, id: s.id }))}
            onScriptSave={handleScriptSave}
            onScriptDelete={handleScriptDelete}
            onScriptToggle={handleScriptToggle}
            onScriptInstall={handleScriptInstall}
            onOpenSettings={handleOpenSettings}
            onOpenEditor={handleOpenEditor}
            mode={mode}
          />
        </ErrorBoundary>
      </div>

      {/* Portal container for dev tools */}
      <div ref={toastPortalRef} />
      {devToolsPortal}
    </>
  );
}
