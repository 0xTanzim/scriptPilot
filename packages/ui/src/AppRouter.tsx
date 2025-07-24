import { Script } from '@scriptpilot/types';
import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App } from './components/CleanApp';
import { ScriptProvider } from './contexts/ScriptContext';

interface AppRouterProps {
  scripts?: Script[];
  currentUrl?: string;
  currentTitle?: string;
  scriptStatus?: Array<{ enabled: boolean; id: string }>;
  onScriptSave?: (script: Script) => Promise<void>;
  onScriptDelete?: (scriptId: string) => Promise<void>;
  onScriptToggle?: (scriptId: string, enabled: boolean) => Promise<void>;
  onScriptInstall?: (url: string) => Promise<void>;
  onOpenSettings?: () => void;
  onOpenEditor?: (scriptId?: string) => void;
  mode?: 'popup' | 'fullscreen';
}

/**
 * AppRouter - Clean Architecture with Context Provider Pattern
 * - Uses React Router for navigation
 * - Uses Context API for state management
 * - Provides clean separation of concerns
 */
export const AppRouter: React.FC<AppRouterProps> = ({
  scripts = [],
  currentUrl = '',
  currentTitle = '',
  scriptStatus = [],
  onScriptSave,
  onScriptDelete,
  onScriptToggle,
  onScriptInstall,
  onOpenSettings,
  onOpenEditor,
  mode = 'popup',
}) => {
  // Set body classes based on mode
  React.useEffect(() => {
    const body = document.body;

    // Remove loading classes and add mode classes
    body.classList.remove('loading');

    if (mode === 'popup') {
      body.classList.add('popup-mode');
      body.classList.remove('fullscreen-mode');
    } else {
      body.classList.add('fullscreen-mode');
      body.classList.remove('popup-mode');
    }

    // Ensure Tailwind base classes are applied
    body.classList.add('bg-background', 'text-foreground');
  }, [mode]);

  const contextValue = {
    scripts,
    currentUrl,
    currentTitle,
    scriptStatus,
    mode,
    onScriptSave,
    onScriptDelete,
    onScriptToggle,
    onScriptInstall,
    onOpenSettings,
    onOpenEditor,
  };

  return (
    <ScriptProvider value={contextValue}>
      <HashRouter>
        <Routes>
          <Route path='/' element={<Navigate to='/list' replace />} />
          <Route path='/list' element={<App />} />
          <Route path='/editor' element={<App />} />
          <Route path='/editor/:scriptId' element={<App />} />
          <Route path='/settings' element={<App />} />
          <Route path='*' element={<Navigate to='/list' replace />} />
        </Routes>
      </HashRouter>
    </ScriptProvider>
  );
};

export default AppRouter;
