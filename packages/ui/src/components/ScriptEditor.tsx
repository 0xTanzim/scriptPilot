import Editor from '@monaco-editor/react';
import type { Script, ScriptMetadata } from '@scriptpilot/types';
import { FileText, Play, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

interface ScriptEditorProps {
  script?: Script;
  onSave?: (script: Script) => void;
  onClose?: () => void;
}

/**
 * Advanced script editor with Monaco Editor and metadata management
 */
export function ScriptEditor({ script, onSave }: ScriptEditorProps) {
  const [code, setCode] = useState(script?.code || defaultScriptTemplate);
  const [metadata, setMetadata] = useState<ScriptMetadata>(
    script?.metadata || {
      name: 'New Script',
      namespace: 'scriptpilot.user',
      version: '1.0.0',
      description: 'A new userscript',
      author: 'ScriptPilot User',
      match: ['https://example.com/*'],
      runAt: 'document-idle',
      grant: [],
    }
  );
  const [isDirty, setIsDirty] = useState(false);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    setIsDirty(true);
  };

  const handleMetadataChange = (field: keyof ScriptMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const scriptToSave: Script = {
      id: script?.id || `script-${Date.now()}`,
      code,
      metadata,
      enabled: script?.enabled ?? true,
      installedAt: script?.installedAt || new Date(),
      updatedAt: new Date(),
      source: script?.source || 'manual',
      size: code.length,
      executionCount: script?.executionCount || 0,
      tags: script?.tags || [],
    };

    onSave?.(scriptToSave);
    setIsDirty(false);
    toast.success('Script saved successfully');
  };

  const handleTest = () => {
    // TODO: Implement script testing functionality
    toast.info('Script testing feature coming soon');
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='border-b border-border p-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <FileText className='h-5 w-5' />
          <h2 className='text-lg font-semibold'>
            {script ? 'Edit Script' : 'New Script'}: {metadata.name}
          </h2>
          {isDirty && (
            <span className='text-sm text-muted-foreground'>
              • Unsaved changes
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleTest}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            Test
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty}
            className='flex items-center gap-2'
          >
            <Save className='h-4 w-4' />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 flex'>
        {/* Editor */}
        <div className='flex-1 flex flex-col'>
          <Editor
            height='100%'
            defaultLanguage='javascript'
            value={code}
            onChange={handleCodeChange}
            theme='vs-dark'
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              cursorBlinking: 'blink',
              cursorStyle: 'line',
              renderLineHighlight: 'line',
              selectionHighlight: true,
              smoothScrolling: true,
            }}
          />
        </div>

        {/* Sidebar */}
        <div className='w-80 border-l border-border bg-muted/50'>
          <Tabs defaultValue='metadata' className='h-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='metadata'>Metadata</TabsTrigger>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
            </TabsList>

            <TabsContent
              value='metadata'
              className='p-4 space-y-4 overflow-auto'
            >
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='name'>Name</Label>
                    <Input
                      id='name'
                      value={metadata.name || ''}
                      onChange={e =>
                        handleMetadataChange('name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      value={metadata.description || ''}
                      onChange={e =>
                        handleMetadataChange('description', e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='version'>Version</Label>
                    <Input
                      id='version'
                      value={metadata.version || ''}
                      onChange={e =>
                        handleMetadataChange('version', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='author'>Author</Label>
                    <Input
                      id='author'
                      value={metadata.author || ''}
                      onChange={e =>
                        handleMetadataChange('author', e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>URL Matching</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='match'>Match URLs</Label>
                    <Textarea
                      id='match'
                      value={metadata.match?.join('\n') || ''}
                      onChange={e =>
                        handleMetadataChange(
                          'match',
                          e.target.value.split('\n').filter(Boolean)
                        )
                      }
                      placeholder='https://example.com/*&#10;https://another-site.com/*'
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor='exclude'>Exclude URLs (optional)</Label>
                    <Textarea
                      id='exclude'
                      value={metadata.exclude?.join('\n') || ''}
                      onChange={e =>
                        handleMetadataChange(
                          'exclude',
                          e.target.value.split('\n').filter(Boolean)
                        )
                      }
                      placeholder='https://example.com/admin/*'
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Permissions</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='grant'>Grant APIs</Label>
                    <Textarea
                      id='grant'
                      value={metadata.grant?.join('\n') || ''}
                      onChange={e =>
                        handleMetadataChange(
                          'grant',
                          e.target.value.split('\n').filter(Boolean)
                        )
                      }
                      placeholder='GM_getValue&#10;GM_setValue&#10;GM_addStyle'
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value='settings'
              className='p-4 space-y-4 overflow-auto'
            >
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Execution Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='runAt'>Run At</Label>
                    <select
                      id='runAt'
                      value={metadata.runAt}
                      onChange={e =>
                        handleMetadataChange('runAt', e.target.value as any)
                      }
                      className='w-full p-2 border border-input rounded-md bg-background'
                    >
                      <option value='document-start'>Document Start</option>
                      <option value='document-end'>Document End</option>
                      <option value='document-idle'>Document Idle</option>
                    </select>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='noframes'
                      checked={metadata.noframes || false}
                      onCheckedChange={(checked: boolean) =>
                        handleMetadataChange('noframes', checked)
                      }
                    />
                    <Label htmlFor='noframes'>No Frames (top frame only)</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Advanced</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='namespace'>Namespace</Label>
                    <Input
                      id='namespace'
                      value={metadata.namespace || ''}
                      onChange={e =>
                        handleMetadataChange('namespace', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='homepage'>Homepage URL</Label>
                    <Input
                      id='homepage'
                      value={metadata.homepage || ''}
                      onChange={e =>
                        handleMetadataChange('homepage', e.target.value)
                      }
                      placeholder='https://github.com/user/script'
                    />
                  </div>
                  <div>
                    <Label htmlFor='updateURL'>Update URL</Label>
                    <Input
                      id='updateURL'
                      value={metadata.updateURL || ''}
                      onChange={e =>
                        handleMetadataChange('updateURL', e.target.value)
                      }
                      placeholder='https://example.com/script.user.js'
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Default script template
const defaultScriptTemplate = `// ==UserScript==
// @name         New Userscript
// @namespace    scriptpilot.user
// @version      1.0.0
// @description  A new userscript created with ScriptPilot
// @author       ScriptPilot User
// @match        https://example.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Your code here
    console.log('Hello from ScriptPilot!');

})();`;
