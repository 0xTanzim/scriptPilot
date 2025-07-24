import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import type { Script, ScriptMetadata } from '@scriptpilot/types';
import { dracula } from '@uiw/codemirror-theme-dracula';
import CodeMirror from '@uiw/react-codemirror';
import {
  AlertCircle,
  FileText,
  Globe,
  Link,
  Play,
  Save,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import '../styles/scrollbar.css';
import {
  validateExcludePattern,
  validateUrlPattern,
} from '../utils/urlPatterns';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

interface ScriptEditorProps {
  script?: Script;
  onSave?: (script: Script) => Promise<void>;
  onClose?: () => void;
}

/**
 * Professional Script Editor - Following Design Pattern #3: Single Responsibility
 * Features: Auto-save, Hotkeys, Validation, Scroll Support, Real-time Sync
 */
export function ScriptEditor({ script, onSave, onClose }: ScriptEditorProps) {
  // State Management - Following Design Pattern #5: Hooks & Logic Abstraction
  const [code, setCode] = useState(script?.code || defaultScriptTemplate);
  const [metadata, setMetadata] = useState<ScriptMetadata>(
    script?.metadata || {
      name: 'New Script',
      namespace: 'scriptpilot.user',
      version: '1.0.0',
      description: 'A new userscript created with ScriptPilot',
      author: 'ScriptPilot User',
      match: ['https://example.com/*'],
      exclude: [],
      runAt: 'document-idle',
      grant: ['none'],
      noframes: false,
    }
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [activeTab, setActiveTab] = useState<'code' | 'metadata'>('code');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false); // Disabled by default

  // Validation state for real-time feedback
  const [validation, setValidation] = useState<{
    match: string[];
    exclude: string[];
  }>({ match: [], exclude: [] });

  // Refs for scroll management
  const metadataRef = useRef<HTMLDivElement>(null);

  // Auto-save effect - Fixed to prevent unwanted triggers and respect user preference
  useEffect(() => {
    if (isDirty && autoSaveEnabled) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Increased to 5 seconds to prevent aggressive auto-save

      return () => clearTimeout(autoSaveTimer);
    }
  }, [isDirty, autoSaveEnabled]); // Only trigger on isDirty and autoSaveEnabled changes

  // Real-time validation effect
  useEffect(() => {
    const matchErrors: string[] = [];
    const excludeErrors: string[] = [];

    // Validate match patterns
    if (metadata.match) {
      metadata.match.forEach(pattern => {
        if (!validateUrlPattern(pattern)) {
          matchErrors.push(`Invalid pattern: ${pattern}`);
        }
      });
    }

    // Validate exclude patterns
    if (metadata.exclude) {
      metadata.exclude.forEach(pattern => {
        if (!validateExcludePattern(pattern)) {
          excludeErrors.push(`Invalid exclude pattern: ${pattern}`);
        }
      });
    }

    setValidation({ match: matchErrors, exclude: excludeErrors });
  }, [metadata.match, metadata.exclude]);

  // Hotkey Support - FIXED: Removed problematic Ctrl+W
  useHotkeys('ctrl+s, cmd+s', e => {
    e.preventDefault();
    handleManualSave();
  });

  // Removed Ctrl+W hotkey that was causing exit issues
  // useHotkeys('ctrl+w, cmd+w', (e) => {
  //   e.preventDefault();
  //   if (onClose) onClose();
  // });

  useHotkeys('ctrl+1, cmd+1', () => setActiveTab('code'));
  useHotkeys('ctrl+2, cmd+2', () => setActiveTab('metadata'));

  // Validation Logic - Design Pattern #11: TypeScript Rules
  const validateMetadata = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!metadata.name?.trim()) {
      errors.name = 'Script name is required';
    }

    if (!metadata.version?.trim()) {
      errors.version = 'Version is required';
    }

    // Validate URL patterns
    metadata.match.forEach((pattern, index) => {
      const validation = validateUrlPattern(pattern);
      if (!validation.isValid) {
        errors[`match_${index}`] = validation.error || 'Invalid URL pattern';
      }
    });

    // Validate exclude patterns
    if (metadata.exclude) {
      metadata.exclude.forEach((pattern, index) => {
        const validation = validateExcludePattern(pattern);
        if (!validation.isValid) {
          errors[`exclude_${index}`] =
            validation.error || 'Invalid exclude pattern';
        }
      });
    }

    return errors;
  }, [metadata]);

  // Auto-save function - Fixed to be less aggressive
  const handleAutoSave = useCallback(async () => {
    if (!onSave || !isDirty) return;

    const errors = validateMetadata();
    if (Object.keys(errors).length > 0) {
      return; // Don't auto-save if there are validation errors
    }

    try {
      const updatedScript: Script = {
        id: script?.id || `script-${Date.now()}`,
        code,
        metadata,
        enabled: script?.enabled ?? true,
        installedAt: script?.installedAt || new Date(),
        updatedAt: new Date(),
        source: script?.source || 'manual',
        size: new Blob([code]).size,
        executionCount: script?.executionCount || 0,
        tags: script?.tags || [],
        installUrl: script?.installUrl,
        lastExecuted: script?.lastExecuted,
        notes: script?.notes,
      };

      await onSave(updatedScript);
      setIsDirty(false);
      // Removed auto-save toast to be less intrusive
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [onSave, isDirty, validateMetadata, script, code, metadata]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (!onSave) return;

    const errors = validateMetadata();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors before saving');
      setActiveTab('metadata');
      return;
    }

    setIsSaving(true);
    try {
      const updatedScript: Script = {
        id: script?.id || `script-${Date.now()}`,
        code,
        metadata,
        enabled: script?.enabled ?? true,
        installedAt: script?.installedAt || new Date(),
        updatedAt: new Date(),
        source: script?.source || 'manual',
        size: new Blob([code]).size,
        executionCount: script?.executionCount || 0,
        tags: script?.tags || [],
        installUrl: script?.installUrl,
        lastExecuted: script?.lastExecuted,
        notes: script?.notes,
      };

      await onSave(updatedScript);
      setIsDirty(false);
      toast.success('Script saved successfully!');
    } catch (error) {
      toast.error('Failed to save script');
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, validateMetadata, script, code, metadata]);

  const handleCodeChange = (value: string) => {
    setCode(value || '');
    setIsDirty(true);
  };

  const handleMetadataChange = (
    field: keyof ScriptMetadata,
    value: string | string[] | boolean
  ) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
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
            <span className='text-sm text-muted-foreground flex items-center gap-1'>
              • Unsaved changes
              {autoSaveEnabled && (
                <span className='text-xs text-blue-600 dark:text-blue-400'>
                  (auto-save enabled)
                </span>
              )}
            </span>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={handleTest}
            className='btn-professional h-12 px-8 text-base font-semibold border-2 border-orange-300 dark:border-orange-600 hover:border-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105'
          >
            <Play className='h-6 w-6 mr-2' />
            Test Script
          </Button>
          <Button
            onClick={handleManualSave}
            disabled={!isDirty || isSaving}
            className='btn-professional h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none'
          >
            <Save className='h-6 w-6 mr-2' />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Content - Enhanced Professional Layout */}
      <div className='flex-1 flex bg-gradient-to-br from-background to-muted/20'>
        {/* Editor - Professional Code Environment */}
        <div className='flex-1 flex flex-col border-r border-border shadow-sm'>
          <div className='bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 border-b border-gray-600 shadow-xl'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4 text-sm text-gray-300'>
                <div className='flex gap-3 devtools-controls'>
                  <div
                    className='devtools-control-ultra close'
                    role='button'
                    tabIndex={0}
                    aria-label='Close'
                  ></div>
                  <div
                    className='devtools-control-ultra minimize'
                    role='button'
                    tabIndex={0}
                    aria-label='Minimize'
                  ></div>
                  <div
                    className='devtools-control-ultra maximize'
                    role='button'
                    tabIndex={0}
                    aria-label='Maximize'
                  ></div>
                </div>
                <span className='font-mono text-gray-200 font-bold text-base ml-3'>
                  script.user.js
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg text-sm text-gray-100 font-bold shadow-lg'>
                  JavaScript
                </div>
                <div className='px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 rounded-lg text-sm text-blue-100 font-bold shadow-lg'>
                  {code.split('\n').length} lines
                </div>
              </div>
            </div>
          </div>
          <CodeMirror
            value={code}
            height='calc(100vh - 240px)'
            theme={dracula}
            extensions={[
              javascript({ jsx: true }),
              EditorView.theme({
                '&': {
                  fontSize: '16px',
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                },
                '.cm-content': {
                  padding: '16px',
                  lineHeight: '1.6',
                },
                '.cm-focused': {
                  outline: 'none',
                },
                '.cm-editor': {
                  borderRadius: '0',
                },
                '.cm-scroller': {
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                },
                '.cm-lineNumbers': {
                  minWidth: '40px',
                },
                '.cm-gutters': {
                  backgroundColor: 'transparent',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                },
              }),
              EditorView.lineWrapping,
            ]}
            onChange={value => handleCodeChange(value)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightActiveLine: true,
              searchKeymap: true,
              historyKeymap: true,
              defaultKeymap: true,
              completionKeymap: true,
              highlightSelectionMatches: true,
            }}
          />
        </div>

        {/* Sidebar - ULTRA PROFESSIONAL: Perfect tab styling and content layout */}
        <div className='w-96 border-l-2 border-border bg-gradient-to-b from-background via-background to-muted/20 flex flex-col shadow-2xl min-h-0'>
          <Tabs
            defaultValue='metadata'
            className='h-full flex flex-col min-h-0'
          >
            <TabsList className='grid w-full grid-cols-2 shrink-0 bg-gray-800 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 p-2 m-3 rounded-xl shadow-lg'>
              <TabsTrigger
                value='metadata'
                className='flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-100 hover:bg-gray-400 dark:hover:bg-gray-400 data-[state=active]:bg-gray-300 dark:data-[state=active]:bg-gray-300 text-gray-800 data-[state=active]:text-gray-900'
              >
                <FileText className='h-4 w-4' />
                Metadata
              </TabsTrigger>
              <TabsTrigger
                value='settings'
                className='flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-100 hover:bg-gray-400 dark:hover:bg-gray-400 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-300 text-gray-800 data-[state=active]:text-gray-900'
              >
                <Settings className='h-4 w-4' />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value='metadata'
              className='flex-1 min-h-0 overflow-hidden'
            >
              <div
                className='h-full overflow-y-scroll p-4 space-y-4 scrollbar-visible'
                style={{
                  height: 'calc(100vh - 300px)',
                  overflowY: 'scroll',
                }}
              >
                {/* Professional metadata indicator */}
                <div className='text-center py-3 px-4 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm'>
                  <div className='flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300'>
                    <FileText className='h-5 w-5' />
                    <span>Script Metadata Configuration</span>
                  </div>
                  <p className='text-xs text-blue-600 dark:text-blue-400 mt-1'>
                    Configure script information and URL patterns
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <Label htmlFor='name' className='text-xs font-medium'>
                        Name *
                      </Label>
                      <Input
                        id='name'
                        value={metadata.name || ''}
                        onChange={e =>
                          handleMetadataChange('name', e.target.value)
                        }
                        placeholder='My Awesome Script'
                        className={cn(!metadata.name && 'border-red-300')}
                      />
                      {!metadata.name && (
                        <p className='text-xs text-red-500 mt-1'>
                          Script name is required
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor='description'
                        className='text-xs font-medium'
                      >
                        Description
                      </Label>
                      <Textarea
                        id='description'
                        value={metadata.description || ''}
                        onChange={e =>
                          handleMetadataChange('description', e.target.value)
                        }
                        placeholder='Describe what your script does...'
                        rows={3}
                        className='resize-none'
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <Label
                          htmlFor='version'
                          className='text-xs font-medium'
                        >
                          Version
                        </Label>
                        <Input
                          id='version'
                          value={metadata.version || ''}
                          onChange={e =>
                            handleMetadataChange('version', e.target.value)
                          }
                          placeholder='1.0.0'
                        />
                      </div>
                      <div>
                        <Label htmlFor='author' className='text-xs font-medium'>
                          Author
                        </Label>
                        <Input
                          id='author'
                          value={metadata.author || ''}
                          onChange={e =>
                            handleMetadataChange('author', e.target.value)
                          }
                          placeholder='Your Name'
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Globe className='h-4 w-4' />
                      URL Matching
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <Label
                        htmlFor='match'
                        className='text-xs font-medium flex items-center gap-1'
                      >
                        Match URLs *
                        {validation.match.length > 0 && (
                          <span className='text-red-500'>
                            <AlertCircle className='h-3 w-3' />
                          </span>
                        )}
                      </Label>
                      <Textarea
                        id='match'
                        value={metadata.match?.join('\n') || ''}
                        onChange={e =>
                          handleMetadataChange(
                            'match',
                            e.target.value.split('\n').filter(Boolean)
                          )
                        }
                        placeholder='https://example.com/*&#10;https://another-site.com/*&#10;*://subdomain.example.com/*'
                        rows={4}
                        className={cn(
                          'font-mono text-xs resize-none',
                          validation.match.length > 0 && 'border-red-300'
                        )}
                      />
                      {validation.match.length > 0 && (
                        <div className='text-xs text-red-500 mt-1 space-y-1'>
                          {validation.match.map((error, idx) => (
                            <p key={idx}>• {error}</p>
                          ))}
                        </div>
                      )}
                      <div className='text-xs text-muted-foreground mt-2'>
                        <p className='font-medium mb-1'>Common patterns:</p>
                        <div className='flex flex-wrap gap-1'>
                          {[
                            'https://example.com/*',
                            '*://example.com/*',
                            'https://*.example.com/*',
                            '*://*/*',
                          ].map(pattern => (
                            <button
                              key={pattern}
                              onClick={() => {
                                const current = metadata.match || [];
                                if (!current.includes(pattern)) {
                                  handleMetadataChange('match', [
                                    ...current,
                                    pattern,
                                  ]);
                                }
                              }}
                              className='px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors'
                            >
                              {pattern}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor='exclude'
                        className='text-xs font-medium flex items-center gap-1'
                      >
                        Exclude URLs (optional)
                        {validation.exclude.length > 0 && (
                          <span className='text-red-500'>
                            <AlertCircle className='h-3 w-3' />
                          </span>
                        )}
                      </Label>
                      <Textarea
                        id='exclude'
                        value={metadata.exclude?.join('\n') || ''}
                        onChange={e =>
                          handleMetadataChange(
                            'exclude',
                            e.target.value.split('\n').filter(Boolean)
                          )
                        }
                        placeholder='https://example.com/admin/*&#10;https://example.com/private/*'
                        rows={2}
                        className={cn(
                          'font-mono text-xs resize-none',
                          validation.exclude.length > 0 && 'border-red-300'
                        )}
                      />
                      {validation.exclude.length > 0 && (
                        <div className='text-xs text-red-500 mt-1 space-y-1'>
                          {validation.exclude.map((error, idx) => (
                            <p key={idx}>• {error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Shield className='h-4 w-4' />
                      Permissions & APIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <Label htmlFor='grant' className='text-xs font-medium'>
                        Grant APIs
                      </Label>
                      <Textarea
                        id='grant'
                        value={metadata.grant?.join('\n') || ''}
                        onChange={e =>
                          handleMetadataChange(
                            'grant',
                            e.target.value.split('\n').filter(Boolean)
                          )
                        }
                        placeholder='GM_getValue&#10;GM_setValue&#10;GM_addStyle&#10;GM_xmlhttpRequest'
                        rows={4}
                        className='font-mono text-xs resize-none'
                      />
                      <div className='text-xs text-muted-foreground mt-2'>
                        <p className='font-medium mb-1'>Common APIs:</p>
                        <div className='flex flex-wrap gap-1'>
                          {[
                            'GM_getValue',
                            'GM_setValue',
                            'GM_addStyle',
                            'GM_xmlhttpRequest',
                            'GM_notification',
                            'GM_openInTab',
                          ].map(api => (
                            <button
                              key={api}
                              onClick={() => {
                                const current = metadata.grant || [];
                                if (!current.includes(api)) {
                                  handleMetadataChange('grant', [
                                    ...current,
                                    api,
                                  ]);
                                }
                              }}
                              className='px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors'
                            >
                              {api}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional metadata completion indicator */}
                <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground text-center py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 mt-6'>
                  <svg
                    className='w-4 h-4 text-blue-600 dark:text-blue-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='font-medium text-blue-700 dark:text-blue-300'>
                    All metadata options configured!
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value='settings'
              className='flex-1 min-h-0 overflow-hidden'
            >
              <div
                className='h-full overflow-y-scroll p-4 space-y-4 scrollbar-visible'
                style={{
                  height: 'calc(100vh - 300px)',
                  overflowY: 'scroll',
                }}
              >
                {/* Professional settings indicator */}
                <div className='text-center py-3 px-4 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950 dark:via-purple-900 dark:to-purple-950 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-sm'>
                  <div className='flex items-center justify-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300'>
                    <Settings className='h-5 w-5' />
                    <span>Script Execution Settings</span>
                  </div>
                  <p className='text-xs text-purple-600 dark:text-purple-400 mt-1'>
                    Configure execution behavior and preferences
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Settings className='h-4 w-4' />
                      Execution Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <Label htmlFor='runAt' className='text-xs font-medium'>
                        Run At
                      </Label>
                      <select
                        id='runAt'
                        value={metadata.runAt}
                        onChange={e =>
                          handleMetadataChange('runAt', e.target.value)
                        }
                        className='w-full p-2 border border-input rounded-md bg-background text-sm'
                      >
                        <option value='document-start'>
                          Document Start (before DOM)
                        </option>
                        <option value='document-end'>
                          Document End (DOM ready)
                        </option>
                        <option value='document-idle'>
                          Document Idle (page loaded)
                        </option>
                      </select>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Controls when the script executes in the page lifecycle
                      </p>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-1'>
                        <Label
                          htmlFor='noframes'
                          className='text-xs font-medium'
                        >
                          No Frames
                        </Label>
                        <p className='text-xs text-muted-foreground'>
                          Run only in the top frame, not in iframes
                        </p>
                      </div>
                      <Switch
                        id='noframes'
                        checked={metadata.noframes || false}
                        onCheckedChange={(checked: boolean) =>
                          handleMetadataChange('noframes', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Link className='h-4 w-4' />
                      Links & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <Label
                        htmlFor='namespace'
                        className='text-xs font-medium'
                      >
                        Namespace
                      </Label>
                      <Input
                        id='namespace'
                        value={metadata.namespace || ''}
                        onChange={e =>
                          handleMetadataChange('namespace', e.target.value)
                        }
                        placeholder='com.example.myscript'
                        className='text-sm'
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        Unique identifier to prevent conflicts
                      </p>
                    </div>
                    <div>
                      <Label htmlFor='homepage' className='text-xs font-medium'>
                        Homepage URL
                      </Label>
                      <Input
                        id='homepage'
                        value={metadata.homepage || ''}
                        onChange={e =>
                          handleMetadataChange('homepage', e.target.value)
                        }
                        placeholder='https://github.com/user/script'
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor='updateURL'
                        className='text-xs font-medium'
                      >
                        Update URL
                      </Label>
                      <Input
                        id='updateURL'
                        value={metadata.updateURL || ''}
                        onChange={e =>
                          handleMetadataChange('updateURL', e.target.value)
                        }
                        placeholder='https://example.com/script.user.js'
                        className='text-sm'
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        URL to check for script updates
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Zap className='h-4 w-4' />
                      Performance & Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                      <div className='p-3 bg-muted/50 rounded-lg'>
                        <p className='text-xs text-muted-foreground'>
                          Script Size
                        </p>
                        <p className='text-lg font-semibold'>
                          {(code.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className='p-3 bg-muted/50 rounded-lg'>
                        <p className='text-xs text-muted-foreground'>
                          Lines of Code
                        </p>
                        <p className='text-lg font-semibold'>
                          {code.split('\n').length}
                        </p>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>
                          Characters:
                        </span>
                        <span className='font-medium'>
                          {code.length.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Words:</span>
                        <span className='font-medium'>
                          {code
                            .split(/\s+/)
                            .filter(Boolean)
                            .length.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>
                          Match patterns:
                        </span>
                        <span className='font-medium'>
                          {metadata.match?.length || 0}
                        </span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>
                          Granted APIs:
                        </span>
                        <span className='font-medium'>
                          {metadata.grant?.length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Settings className='h-4 w-4' />
                      Editor Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-1'>
                        <Label
                          htmlFor='autoSave'
                          className='text-xs font-medium'
                        >
                          Auto-save
                        </Label>
                        <p className='text-xs text-muted-foreground'>
                          Automatically save changes after 5 seconds of
                          inactivity
                        </p>
                      </div>
                      <Switch
                        id='autoSave'
                        checked={autoSaveEnabled}
                        onCheckedChange={setAutoSaveEnabled}
                      />
                    </div>
                    {autoSaveEnabled && (
                      <div className='text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950 rounded border'>
                        ℹ️ Auto-save is enabled. Your changes will be saved
                        automatically.
                      </div>
                    )}
                    {!autoSaveEnabled && (
                      <div className='text-xs text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-950 rounded border'>
                        ⚠️ Auto-save is disabled. Use Ctrl+S to save manually.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Professional settings completion indicator */}
                <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground text-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 mt-6'>
                  <svg
                    className='w-4 h-4 text-green-600 dark:text-green-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='font-medium text-green-700 dark:text-green-300'>
                    All execution settings configured!
                  </span>
                </div>
              </div>
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
