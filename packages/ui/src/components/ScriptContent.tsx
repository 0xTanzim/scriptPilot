import { Script } from '@scriptpilot/types';
import React from 'react';
import { ScriptEditor } from './ScriptEditor';
import { ScriptList } from './ScriptList';
import { SettingsPanel } from './SettingsPanel';
import { TabsContent } from './ui/tabs';

interface ScriptContentProps {
  scripts: Script[];
  selectedScript?: Script;
  mode: 'popup' | 'fullscreen';
  onEditScript: (script: Script) => void;
  onCreateScript: () => void;
  onDeleteScript: (scriptId: string) => Promise<void>;
  onToggleScript: (scriptId: string, enabled: boolean) => Promise<void>;
  onSaveScript: (script: Script) => Promise<void>;
  onCloseEditor: () => void;
  onOpenSettings?: () => void;
}

/**
 * Content Component - Container Component Pattern
 * Manages content area with tab-based routing
 */
export const ScriptContent: React.FC<ScriptContentProps> = ({
  scripts,
  selectedScript,
  mode,
  onEditScript,
  onCreateScript,
  onDeleteScript,
  onToggleScript,
  onSaveScript,
  onCloseEditor,
  onOpenSettings,
}) => {
  return (
    <div className='flex-1 overflow-hidden'>
      <TabsContent value='list' className='h-full m-0'>
        <ScriptList
          scripts={scripts}
          onEditScript={onEditScript}
          onCreateScript={onCreateScript}
          onDeleteScript={onDeleteScript}
          onToggleScript={onToggleScript}
        />
      </TabsContent>

      <TabsContent value='editor' className='h-full m-0'>
        <ScriptEditor
          script={selectedScript}
          onSave={onSaveScript}
          onClose={onCloseEditor}
        />
      </TabsContent>

      <TabsContent value='settings' className='h-full m-0'>
        <SettingsPanel onOpenFullSettings={onOpenSettings} mode={mode} />
      </TabsContent>
    </div>
  );
};

export default ScriptContent;
