import type { ScriptStats } from '@scriptpilot/types';
import { Activity, AlertCircle, CheckCircle, Pause } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

/**
 * Component showing overall script execution status and statistics
 */
export function StatusIndicator() {
  const [stats, setStats] = useState<ScriptStats>({
    totalScripts: 0,
    enabledScripts: 0,
    disabledScripts: 0,
    errorScripts: 0,
    executionsToday: 0,
  });
  const [isActive, setIsActive] = useState(true);

  // Mock data for development
  useEffect(() => {
    const mockStats: ScriptStats = {
      totalScripts: 12,
      enabledScripts: 8,
      disabledScripts: 3,
      errorScripts: 1,
      executionsToday: 142,
      mostActiveScript: 'GitHub Dark Mode',
    };

    setStats(mockStats);
  }, []);

  const getStatusIcon = () => {
    if (!isActive) {
      return <Pause className='h-4 w-4 text-muted-foreground' />;
    }
    if (stats.errorScripts > 0) {
      return <AlertCircle className='h-4 w-4 text-destructive' />;
    }
    if (stats.enabledScripts > 0) {
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    }
    return <Activity className='h-4 w-4 text-muted-foreground' />;
  };

  const getStatusText = () => {
    if (!isActive) return 'Paused';
    if (stats.errorScripts > 0) return 'Issues Detected';
    if (stats.enabledScripts > 0) return 'Active';
    return 'Ready';
  };

  const getStatusVariant = ():
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline' => {
    if (!isActive) return 'secondary';
    if (stats.errorScripts > 0) return 'destructive';
    return 'default';
  };

  return (
    <TooltipProvider>
      <div className='flex items-center gap-3'>
        {/* Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getStatusVariant()}
              className='flex items-center gap-1.5'
            >
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className='text-sm space-y-1'>
              <div className='font-medium'>ScriptPilot Status</div>
              <div>Total Scripts: {stats.totalScripts}</div>
              <div>Enabled: {stats.enabledScripts}</div>
              <div>Disabled: {stats.disabledScripts}</div>
              {stats.errorScripts > 0 && (
                <div className='text-destructive'>
                  Errors: {stats.errorScripts}
                </div>
              )}
              <div>Executions Today: {stats.executionsToday}</div>
              {stats.mostActiveScript && (
                <div>Most Active: {stats.mostActiveScript}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Quick Stats */}
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <span>
            {stats.enabledScripts}/{stats.totalScripts} active
          </span>
          {stats.executionsToday > 0 && (
            <>
              <span>•</span>
              <span>{stats.executionsToday} runs today</span>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
