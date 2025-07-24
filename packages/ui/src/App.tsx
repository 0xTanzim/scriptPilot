import type { Script } from '@scriptpilot/types';
import { Code2, List, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { ScriptEditor } from './components/ScriptEditor';
import { ScriptList } from './components/ScriptList';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusIndicator } from './components/StatusIndicator';
import { Toaster } from './components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TooltipProvider } from './components/ui/tooltip';
import './globals.css';

type ActiveView = 'list' | 'editor' | 'settings';

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const [selectedScript, setSelectedScript] = useState<Script | undefined>();

  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    setActiveView('editor');
  };

  const handleCreateScript = () => {
    setSelectedScript(undefined);
    setActiveView('editor');
  };

  const handleSaveScript = (script: Script) => {
    // TODO: Integrate with @scriptpilot/core for saving
    console.log('Saving script:', script);
    setActiveView('list');
  };

  const handleCloseEditor = () => {
    setSelectedScript(undefined);
    setActiveView('list');
  };

  return (
    <TooltipProvider>
      <div className='h-screen flex flex-col bg-background text-foreground'>
        {/* Header */}
        <header className='border-b border-border p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded bg-primary flex items-center justify-center'>
                <Code2 className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <h1 className='text-xl font-bold'>ScriptPilot</h1>
                <p className='text-sm text-muted-foreground'>
                  Modern Userscript Manager
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <StatusIndicator />
            </div>
          </div>
        </header>

        {/* Navigation */}
        <Tabs value={activeView} onValueChange={setActiveView as any}>
          <div className='border-b border-border px-4'>
            <TabsList className='h-12'>
              <TabsTrigger value='list' className='flex items-center gap-2'>
                <List className='h-4 w-4' />
                Scripts
              </TabsTrigger>
              <TabsTrigger
                value='editor'
                className='flex items-center gap-2'
                disabled={activeView !== 'editor'}
              >
                <Code2 className='h-4 w-4' />
                Editor
                {selectedScript && (
                  <span className='text-xs text-muted-foreground'>
                    - {selectedScript.metadata.name}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='settings' className='flex items-center gap-2'>
                <SettingsIcon className='h-4 w-4' />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-hidden'>
            <TabsContent value='list' className='h-full m-0'>
              <ScriptList
                onEditScript={handleEditScript}
                onCreateScript={handleCreateScript}
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
              <SettingsPanel />
            </TabsContent>
          </div>
        </Tabs>

        {/* Toast notifications */}
        <Toaster position='bottom-right' />
      </div>
    </TooltipProvider>
  );
}
