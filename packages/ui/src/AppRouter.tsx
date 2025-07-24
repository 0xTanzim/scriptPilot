import { Script } from '@scriptpilot/types';
import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App } from './components/CleanApp';
import { PopupView } from './components/PopupView';
import { WelcomeScreen } from './components/WelcomeScreen';
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
 * - Includes welcome screen for new users
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
  // Check if this is a new user (no scripts created yet)
  const isNewUser = scripts.length === 0;
  const isFirstVisit = !localStorage.getItem('scriptpilot-visited');

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

    // Mark as visited
    if (!localStorage.getItem('scriptpilot-visited')) {
      localStorage.setItem('scriptpilot-visited', 'true');
    }
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

  // Handle welcome screen actions
  const handleGetStarted = () => {
    window.location.hash = '#/list';
  };

  const handleCreateFirstScript = () => {
    if (onOpenEditor) {
      onOpenEditor();
    } else {
      window.location.hash = '#/editor';
    }
  };

  // Show welcome screen for new users in fullscreen mode or first visit
  const shouldShowWelcome =
    (isNewUser && isFirstVisit && mode === 'fullscreen') ||
    window.location.hash === '#/welcome';

  if (shouldShowWelcome) {
    return (
      <ScriptProvider value={contextValue}>
        <WelcomeScreen
          onGetStarted={handleGetStarted}
          onCreateScript={handleCreateFirstScript}
          onOpenSettings={onOpenSettings}
        />
      </ScriptProvider>
    );
  }

  // In popup mode, use simplified PopupView component
  if (mode === 'popup') {
    return (
      <ScriptProvider value={contextValue}>
        <PopupView
          scripts={scripts}
          currentUrl={currentUrl}
          scriptStatus={scriptStatus}
          onEditScript={script => onOpenEditor?.(script.id)}
          onCreateScript={() => onOpenEditor?.()}
          onToggleScript={onScriptToggle}
          onOpenSettings={onOpenSettings}
        />
      </ScriptProvider>
    );
  }

  return (
    <ScriptProvider value={contextValue}>
      <HashRouter>
        <Routes>
          <Route
            path='/'
            element={
              isNewUser && mode === 'fullscreen' ? (
                <Navigate to='/welcome' replace />
              ) : (
                <Navigate to='/list' replace />
              )
            }
          />
          <Route
            path='/welcome'
            element={
              <WelcomeScreen
                onGetStarted={handleGetStarted}
                onCreateScript={handleCreateFirstScript}
                onOpenSettings={onOpenSettings}
              />
            }
          />
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
