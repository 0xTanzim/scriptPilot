import type { Script } from '@scriptpilot/types';
import { Code2, Lightbulb, Plus, Search, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Switch } from './ui/switch';

interface ScriptListProps {
  scripts?: Script[];
  onEditScript?: (script: Script) => void;
  onCreateScript?: () => void;
  onDeleteScript?: (scriptId: string) => Promise<void>;
  onToggleScript?: (scriptId: string, enabled: boolean) => Promise<void>;
}

/**
 * Component for displaying and managing the list of userscripts
 */
export function ScriptList({
  scripts: initialScripts = [],
  onEditScript,
  onCreateScript,
  onDeleteScript,
  onToggleScript,
}: ScriptListProps) {
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Use provided scripts directly
  useEffect(() => {
    setScripts(initialScripts);
    setLoading(false);
  }, [initialScripts]);

  const filteredScripts = scripts.filter(
    script =>
      script.metadata.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.metadata.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const toggleScript = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    const newEnabled = !script.enabled;

    // Optimistic update
    setScripts(prev =>
      prev.map(s => (s.id === scriptId ? { ...s, enabled: newEnabled } : s))
    );

    try {
      if (onToggleScript) {
        await onToggleScript(scriptId, newEnabled);
      }
      toast.success(
        `${script.metadata.name} ${newEnabled ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Failed to toggle script:', error);
      // Revert on error
      setScripts(prev =>
        prev.map(s => (s.id === scriptId ? { ...s, enabled: !newEnabled } : s))
      );
      toast.error('Failed to toggle script');
    }
  };

  const deleteScript = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    try {
      if (onDeleteScript) {
        await onDeleteScript(scriptId);
      }
      setScripts(prev => prev.filter(s => s.id !== scriptId));
      toast.success(`${script.metadata.name} deleted`);
    } catch (error) {
      console.error('Failed to delete script:', error);
      toast.error('Failed to delete script');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-muted-foreground'>Loading scripts...</div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col p-6'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search scripts...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button onClick={onCreateScript} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          New Script
        </Button>
      </div>

      {/* Scripts Grid */}
      <div className='flex-1 overflow-auto'>
        {filteredScripts.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full py-12 px-6 text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6'>
              <Code2 className='h-8 w-8 text-white' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>
              {searchQuery ? 'No Scripts Found' : 'Welcome to ScriptPilot!'}
            </h3>
            <p className='text-muted-foreground mb-6 max-w-sm'>
              {searchQuery
                ? `No scripts match "${searchQuery}". Try adjusting your search or create a new script.`
                : 'Get started by creating your first userscript. Write powerful scripts to enhance any website.'}
            </p>
            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                onClick={onCreateScript}
                className='flex items-center gap-2'
              >
                <Plus className='h-4 w-4' />
                Create Your First Script
              </Button>
              {searchQuery && (
                <Button
                  variant='outline'
                  onClick={() => setSearchQuery('')}
                  className='flex items-center gap-2'
                >
                  <X className='h-4 w-4' />
                  Clear Search
                </Button>
              )}
            </div>
            {!searchQuery && (
              <div className='mt-8 p-4 bg-muted/50 rounded-lg max-w-md'>
                <h4 className='font-medium mb-2 flex items-center gap-2'>
                  <Lightbulb className='h-4 w-4' />
                  Quick Tips
                </h4>
                <ul className='text-sm text-muted-foreground space-y-1 text-left'>
                  <li>
                    • Install scripts from GreasyFork or other repositories
                  </li>
                  <li>• Write custom scripts with full TypeScript support</li>
                  <li>
                    • Debug your scripts with built-in DevTools integration
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredScripts.map(script => (
              <Card
                key={script.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-base mb-1'>
                        {script.metadata.name}
                      </CardTitle>
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {script.metadata.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <Settings className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => onEditScript?.(script)}
                        >
                          Edit Script
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteScript(script.id)}
                          className='text-destructive'
                        >
                          Delete Script
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Status</span>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={script.enabled}
                          onCheckedChange={() => toggleScript(script.id)}
                        />
                        <span className='text-sm text-muted-foreground'>
                          {script.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>
                        v{script.metadata.version}
                      </Badge>
                      <Badge variant='outline'>
                        {script.metadata.match?.length || 0} sites
                      </Badge>
                    </div>

                    <div className='text-xs text-muted-foreground'>
                      Updated {formatDate(script.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
