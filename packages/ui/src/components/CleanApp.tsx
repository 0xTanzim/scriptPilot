import { Script } from '@scriptpilot/types';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ScriptLayout } from '../components/layouts/ScriptLayout';
import { ScriptContent } from '../components/ScriptContent';
import { ScriptHeader } from '../components/ScriptHeader';
import { ScriptNavigation } from '../components/ScriptNavigation';
import { Toaster } from '../components/ui/sonner';
import { Tabs } from '../components/ui/tabs';
import { TooltipProvider } from '../components/ui/tooltip';
import { useScriptContext } from '../contexts/ScriptContext';

type ActiveView = 'list' | 'editor' | 'settings';

/**
 * Main App Component - Clean React Architecture
 * Uses Context Pattern for state management
 * Uses Layout Pattern for consistent UI structure
 * Uses Custom Hooks for navigation logic
 */
export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const context = useScriptContext();

  const [selectedScript, setSelectedScript] = useState<Script | undefined>();

  // Determine current view from React Router location
  const activeView: ActiveView = location.pathname.startsWith('/editor')
    ? 'editor'
    : location.pathname.startsWith('/settings')
      ? 'settings'
      : 'list';

  // Handle script selection from URL params
  useEffect(() => {
    if (params.scriptId && context.scripts.length > 0) {
      const script = context.scripts.find(s => s.id === params.scriptId);
      setSelectedScript(script);
    } else if (!params.scriptId) {
      setSelectedScript(undefined);
    }
  }, [params.scriptId, context.scripts]);

  // Navigation handlers using React Router
  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    if (context.mode === 'popup' && context.onOpenEditor) {
      context.onOpenEditor(script.id);
    } else {
      navigate(`/editor/${script.id}`);
    }
  };

  const handleCreateScript = () => {
    setSelectedScript(undefined);
    if (context.mode === 'popup' && context.onOpenEditor) {
      context.onOpenEditor();
    } else {
      navigate('/editor');
    }
  };

  const handleSaveScript = async (script: Script) => {
    try {
      if (context.onScriptSave) {
        await context.onScriptSave(script);
      }
      navigate('/list');
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      if (context.onScriptDelete) {
        await context.onScriptDelete(scriptId);
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  const handleToggleScript = async (scriptId: string, enabled: boolean) => {
    try {
      if (context.onScriptToggle) {
        await context.onScriptToggle(scriptId, enabled);
      }
    } catch (error) {
      console.error('Failed to toggle script:', error);
    }
  };

  const handleCloseEditor = () => {
    setSelectedScript(undefined);
    navigate('/list');
  };

  const handleNavigation = (view: string) => {
    navigate(`/${view}`);
  };

  return (
    <TooltipProvider>
      <ScriptLayout mode={context.mode}>
        <ScriptHeader scriptStatus={context.scriptStatus} />

        {/* Tabs wrapper for Navigation and Content */}
        <Tabs value={activeView} onValueChange={handleNavigation}>
          <ScriptNavigation selectedScript={selectedScript} />

          <ScriptContent
            scripts={context.scripts}
            selectedScript={selectedScript}
            mode={context.mode}
            onEditScript={handleEditScript}
            onCreateScript={handleCreateScript}
            onDeleteScript={handleDeleteScript}
            onToggleScript={handleToggleScript}
            onSaveScript={handleSaveScript}
            onCloseEditor={handleCloseEditor}
            onOpenSettings={context.onOpenSettings}
          />
        </Tabs>

        <Toaster position='bottom-right' />
      </ScriptLayout>
    </TooltipProvider>
  );
};

export default App;
