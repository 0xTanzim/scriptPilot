import type { Script } from '@scriptpilot/types';
import { Plus, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  onEditScript?: (script: Script) => void;
  onCreateScript?: () => void;
}

/**
 * Component for displaying and managing the list of userscripts
 */
export function ScriptList({ onEditScript, onCreateScript }: ScriptListProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data for development
  useEffect(() => {
    const mockScripts: Script[] = [
      {
        id: '1',
        code: '// GitHub dark mode script\nconsole.log("GitHub dark mode enabled");',
        metadata: {
          name: 'GitHub Dark Mode',
          namespace: 'scriptpilot.github',
          version: '1.0.0',
          description: 'Applies dark mode to GitHub',
          author: 'ScriptPilot User',
          match: ['https://github.com/*'],
          grant: ['GM_addStyle'],
          runAt: 'document-start',
        },
        enabled: true,
        installedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        source: 'manual' as const,
        size: 1024,
        executionCount: 42,
        tags: ['github', 'dark-mode'],
      },
      {
        id: '2',
        code: '// YouTube ad blocking script\nconsole.log("YouTube ads blocked");',
        metadata: {
          name: 'YouTube Ad Blocker',
          namespace: 'scriptpilot.youtube',
          version: '2.1.0',
          description: 'Blocks advertisements on YouTube',
          author: 'ScriptPilot User',
          match: ['https://www.youtube.com/*'],
          grant: ['GM_addStyle', 'GM_getValue', 'GM_setValue'],
          runAt: 'document-idle',
        },
        enabled: false,
        installedAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10'),
        source: 'manual' as const,
        size: 2048,
        executionCount: 128,
        tags: ['youtube', 'ads'],
      },
    ];

    setTimeout(() => {
      setScripts(mockScripts);
      setLoading(false);
    }, 500);
  }, []);

  const filteredScripts = scripts.filter(
    script =>
      script.metadata.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.metadata.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const toggleScript = (scriptId: string) => {
    setScripts(prev =>
      prev.map(script =>
        script.id === scriptId
          ? { ...script, enabled: !script.enabled }
          : script
      )
    );

    const script = scripts.find(s => s.id === scriptId);
    if (script) {
      toast.success(
        `${script.metadata.name} ${script.enabled ? 'disabled' : 'enabled'}`
      );
    }
  };

  const deleteScript = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (script) {
      setScripts(prev => prev.filter(s => s.id !== scriptId));
      toast.success(`${script.metadata.name} deleted`);
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
                      Updated {script.updatedAt.toLocaleDateString()}
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
