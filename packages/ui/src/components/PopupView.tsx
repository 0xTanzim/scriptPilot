import type { Script } from '@scriptpilot/types';
import { Code2, Plus, Settings, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';

interface PopupViewProps {
  scripts: Script[];
  currentUrl: string;
  scriptStatus: Array<{ enabled: boolean; id: string }>;
  onEditScript?: (script: Script) => void;
  onCreateScript?: () => void;
  onToggleScript?: (scriptId: string, enabled: boolean) => Promise<void>;
  onOpenSettings?: () => void;
}

export function PopupView({
  scripts,
  currentUrl,
  scriptStatus,
  onEditScript,
  onCreateScript,
  onToggleScript,
  onOpenSettings,
}: PopupViewProps) {
  // Get scripts that match current URL
  const activeScripts = scripts.filter(script => {
    if (!script.metadata.match) return false;
    return script.metadata.match.some(pattern => {
      // Simple pattern matching - can be enhanced
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(currentUrl);
    });
  });

  const enabledCount = scripts.filter(s => s.enabled).length;
  const totalCount = scripts.length;

  return (
    <div className='w-full h-full bg-gradient-to-br from-background via-background to-muted/10'>
      {/* Header */}
      <div className='p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <Zap className='h-4 w-4 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900 dark:text-white'>
                ScriptPilot
              </h1>
              <p className='text-xs text-muted-foreground'>
                {enabledCount} of {totalCount} scripts enabled
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onOpenSettings}
            className='h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-black/20'
          >
            <Settings className='h-4 w-4' />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className='flex gap-2'>
          <Button
            onClick={onCreateScript}
            size='sm'
            className='flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200'
          >
            <Plus className='h-4 w-4 mr-1' />
            New Script
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onOpenSettings}
            className='px-3 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          >
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-hidden'>
        {activeScripts.length > 0 ? (
          <div className='p-3'>
            <div className='text-xs font-medium text-muted-foreground mb-3 px-1'>
              🔥 ACTIVE ON THIS PAGE ({activeScripts.length})
            </div>
            <div className='space-y-2'>
              {activeScripts.map(script => (
                <Card
                  key={script.id}
                  className='card-professional hover:shadow-md transition-all duration-200 border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
                >
                  <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-medium text-sm text-gray-900 dark:text-white truncate'>
                            {script.metadata.name}
                          </h3>
                          <span className='flex-shrink-0 h-2 w-2 bg-green-500 rounded-full'></span>
                        </div>
                        <p className='text-xs text-muted-foreground line-clamp-2'>
                          {script.metadata.description || 'No description'}
                        </p>
                      </div>
                      <div className='flex items-center gap-2 ml-2'>
                        <Switch
                          checked={script.enabled}
                          onCheckedChange={checked =>
                            onToggleScript?.(script.id, checked)
                          }
                          className='scale-90'
                        />
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onEditScript?.(script)}
                          className='h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20'
                        >
                          <Code2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : scripts.length === 0 ? (
          // Welcome state
          <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
            <div className='h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg'>
              <Code2 className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-2'>
              Welcome to ScriptPilot!
            </h2>
            <p className='text-sm text-muted-foreground mb-4 max-w-xs'>
              Get started by creating your first userscript to enhance any
              website.
            </p>
            <Button
              onClick={onCreateScript}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'
            >
              <Plus className='h-4 w-4 mr-2' />
              Create Your First Script
            </Button>
          </div>
        ) : (
          // No active scripts on this page
          <div className='p-4'>
            <div className='text-center py-8'>
              <div className='h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3'>
                <Code2 className='h-6 w-6 text-gray-400' />
              </div>
              <h3 className='font-medium text-gray-900 dark:text-white mb-2'>
                No scripts for this page
              </h3>
              <p className='text-sm text-muted-foreground mb-4'>
                You have {totalCount} script{totalCount !== 1 ? 's' : ''} total,
                but none match this URL.
              </p>
              <Button
                onClick={onCreateScript}
                variant='outline'
                size='sm'
                className='border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              >
                <Plus className='h-4 w-4 mr-2' />
                Create Script for This Page
              </Button>
            </div>

            {/* All Scripts Summary */}
            {scripts.length > 0 && (
              <div>
                <div className='text-xs font-medium text-muted-foreground mb-3 px-1 border-t border-border pt-4'>
                  📋 ALL SCRIPTS ({totalCount})
                </div>
                <div className='space-y-2 max-h-32 overflow-y-auto'>
                  {scripts.slice(0, 3).map(script => (
                    <Card
                      key={script.id}
                      className='border border-border bg-muted/30 hover:bg-muted/50 transition-colors duration-200'
                    >
                      <CardContent className='p-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-medium text-xs text-gray-900 dark:text-white truncate'>
                              {script.metadata.name}
                            </h4>
                            <p className='text-xs text-muted-foreground truncate'>
                              {script.metadata.match?.[0] || 'No URL pattern'}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Switch
                              checked={script.enabled}
                              onCheckedChange={checked =>
                                onToggleScript?.(script.id, checked)
                              }
                              className='scale-75'
                            />
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => onEditScript?.(script)}
                              className='h-6 w-6 p-0'
                            >
                              <Code2 className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {scripts.length > 3 && (
                    <div className='text-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={onOpenSettings}
                        className='text-xs text-muted-foreground hover:text-foreground'
                      >
                        View all {scripts.length} scripts...
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className='border-t border-border p-3 bg-muted/20'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onOpenSettings}
          className='w-full text-xs text-muted-foreground hover:text-foreground justify-center'
        >
          Open Full Settings & Editor
        </Button>
      </div>
    </div>
  );
}
