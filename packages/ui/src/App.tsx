import type { Script } from '@scriptpilot/types';
import { Code2, List, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ScriptEditor } from './components/ScriptEditor';
import { ScriptList } from './components/ScriptList';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusIndicator } from './components/StatusIndicator';
import { Toaster } from './components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TooltipProvider } from './components/ui/tooltip';
import './globals.css';

type ActiveView = 'list' | 'editor' | 'settings';

interface AppProps {
  scripts?: Script[];
  currentUrl?: string;
  currentTitle?: string;
  scriptStatus?: any[];
  onScriptSave?: (script: Script) => Promise<void>;
  onScriptDelete?: (scriptId: string) => Promise<void>;
  onScriptToggle?: (scriptId: string, enabled: boolean) => Promise<void>;
  onScriptInstall?: (url: string) => Promise<void>;
  onOpenSettings?: () => void;
  onOpenEditor?: (scriptId?: string) => void;
  mode?: 'popup' | 'fullscreen';
}

export function App({
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
}: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [selectedScript, setSelectedScript] = useState<Script | undefined>();

  // Determine current view from React Router location
  const activeView: ActiveView = location.pathname.startsWith('/editor')
    ? 'editor'
    : location.pathname.startsWith('/settings')
      ? 'settings'
      : 'list';

  // Handle script selection from URL params
  useEffect(() => {
    if (params.scriptId && scripts.length > 0) {
      const script = scripts.find(s => s.id === params.scriptId);
      setSelectedScript(script);
    } else if (!params.scriptId) {
      setSelectedScript(undefined);
    }
  }, [params.scriptId, scripts]);

  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    if (mode === 'popup' && onOpenEditor) {
      onOpenEditor(script.id);
    } else {
      // Navigate to editor with script ID using React Router
      navigate(`/editor/${script.id}`);
    }
  };

  const handleCreateScript = () => {
    setSelectedScript(undefined);
    if (mode === 'popup' && onOpenEditor) {
      onOpenEditor();
    } else {
      // Navigate to editor without script ID using React Router
      navigate('/editor');
    }
  };

  const handleSaveScript = async (script: Script) => {
    try {
      if (onScriptSave) {
        await onScriptSave(script);
      }
      // Navigate back to list after saving
      navigate('/list');
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      if (onScriptDelete) {
        await onScriptDelete(scriptId);
      }
      // Don't change hash on delete - stay on current view
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  const handleToggleScript = async (scriptId: string, enabled: boolean) => {
    try {
      if (onScriptToggle) {
        await onScriptToggle(scriptId, enabled);
      }
      // Don't change hash on toggle - stay on current view
    } catch (error) {
      console.error('Failed to toggle script:', error);
    }
  };

  const handleCloseEditor = () => {
    setSelectedScript(undefined);
    // Navigate back to list using React Router
    navigate('/list');
  };

  const containerClass =
    mode === 'popup'
      ? 'w-full h-[500px] flex flex-col bg-background text-foreground'
      : 'min-h-screen w-full flex flex-col bg-background text-foreground';

  return (
    <TooltipProvider>
      <div className={containerClass}>
        {/* Header */}
        <header className='border-b border-border p-3 sm:p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <div className='w-6 h-6 sm:w-8 sm:h-8 rounded bg-primary flex items-center justify-center'>
                <Code2 className='h-3 w-3 sm:h-5 sm:w-5 text-primary-foreground' />
              </div>
              <div>
                <h1 className='text-lg sm:text-xl font-bold'>ScriptPilot</h1>
                <p className='text-xs sm:text-sm text-muted-foreground hidden sm:block'>
                  Modern Userscript Manager
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <StatusIndicator
                issuesCount={scriptStatus.filter(s => !s.enabled).length}
                activeCount={scriptStatus.filter(s => s.enabled).length}
                runsToday={scriptStatus.length}
              />
            </div>
          </div>
        </header>

        {/* Navigation */}
        <Tabs
          value={activeView}
          onValueChange={(value: string) => {
            // Navigate using React Router instead of setting state
            navigate(`/${value}`);
          }}
        >
          <div className='border-b border-border px-3 sm:px-4'>
            <TabsList className='h-10 sm:h-12 w-full sm:w-auto'>
              <TabsTrigger
                value='list'
                className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
              >
                <List className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Scripts</span>
                <span className='sm:hidden'>List</span>
              </TabsTrigger>
              <TabsTrigger
                value='editor'
                className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
              >
                <Code2 className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Editor</span>
                <span className='sm:hidden'>Edit</span>
                {selectedScript && (
                  <span className='text-xs text-muted-foreground hidden md:inline'>
                    - {selectedScript.metadata.name}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value='settings'
                className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
              >
                <SettingsIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Settings</span>
                <span className='sm:hidden'>Set</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-hidden'>
            <TabsContent value='list' className='h-full m-0'>
              <ScriptList
                scripts={scripts}
                onEditScript={handleEditScript}
                onCreateScript={handleCreateScript}
                onDeleteScript={handleDeleteScript}
                onToggleScript={handleToggleScript}
              />
            </TabsContent>

            <TabsContent value='editor' className='h-full m-0'>
              <ScriptEditor
                script={selectedScript}
                onSave={handleSaveScript}
                onClose={handleCloseEditor}
              />
            </TabsContent>

            <TabsContent value='settings' className='h-full m-0'>
              <SettingsPanel onOpenFullSettings={onOpenSettings} mode={mode} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Toast notifications */}
        <Toaster position='bottom-right' />
      </div>
    </TooltipProvider>
  );
}

export default App;
