import { ScriptEditor } from './components/ScriptEditor';
import { ScriptList } from './components/ScriptList';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusIndicator } from './components/StatusIndicator';
import { Toaster } from './components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import './globals.css';

/**
 * Main ScriptPilot application component
 * Provides a tabbed interface for managing userscripts
 */
export function App() {
  return (
    <div className='h-screen flex flex-col bg-background text-foreground'>
      <header className='border-b border-border p-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-xl font-semibold'>ScriptPilot</h1>
          <StatusIndicator />
        </div>
      </header>

      <div className='flex-1 overflow-hidden'>
        <Tabs defaultValue='scripts' className='h-full flex flex-col'>
          <TabsList className='grid w-full grid-cols-3 bg-muted'>
            <TabsTrigger value='scripts'>Scripts</TabsTrigger>
            <TabsTrigger value='editor'>Editor</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='scripts' className='flex-1 overflow-hidden'>
            <ScriptList />
          </TabsContent>

          <TabsContent value='editor' className='flex-1 overflow-hidden'>
            <ScriptEditor />
          </TabsContent>

          <TabsContent value='settings' className='flex-1 overflow-hidden'>
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}
