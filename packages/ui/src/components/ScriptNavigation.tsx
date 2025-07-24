import { Script } from '@scriptpilot/types';
import { Code2, List, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';
import { TabsList, TabsTrigger } from './ui/tabs';

interface ScriptNavigationProps {
  selectedScript?: Script;
}

/**
 * Navigation Component - Presentation Component Pattern
 * Pure UI component for tab navigation triggers
 */
export const ScriptNavigation: React.FC<ScriptNavigationProps> = ({
  selectedScript,
}) => {
  return (
    <div className='border-b border-border px-3 sm:px-4'>
      <TabsList className='h-10 sm:h-12 w-full sm:w-auto'>
        <TabsTrigger
          value='list'
          className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
        >
          <List className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Scripts</span>
          <span className='sm:hidden'>List</span>
        </TabsTrigger>

        <TabsTrigger
          value='editor'
          className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
        >
          <Code2 className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Editor</span>
          <span className='sm:hidden'>Edit</span>
          {selectedScript && (
            <span className='text-xs text-muted-foreground hidden md:inline'>
              - {selectedScript.metadata.name}
            </span>
          )}
        </TabsTrigger>

        <TabsTrigger
          value='settings'
          className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
        >
          <SettingsIcon className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Settings</span>
          <span className='sm:hidden'>Set</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default ScriptNavigation;
