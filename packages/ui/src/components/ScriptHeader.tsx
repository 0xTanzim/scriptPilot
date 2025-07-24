import { Code2 } from 'lucide-react';
import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface ScriptHeaderProps {
  scriptStatus: Array<{ enabled: boolean; id: string }>;
}

/**
 * Header Component - Presentational Component Pattern
 * Contains branding and status information
 */
export const ScriptHeader: React.FC<ScriptHeaderProps> = ({ scriptStatus }) => {
  return (
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
  );
};

export default ScriptHeader;
