import type { Script } from '@scriptpilot/types';
import { Plus, Search, Settings } from 'lucide-react';
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
          <div className='flex items-center justify-center h-full text-muted-foreground'>
            {searchQuery
              ? 'No scripts match your search'
              : 'No scripts found. Create your first script!'}
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
