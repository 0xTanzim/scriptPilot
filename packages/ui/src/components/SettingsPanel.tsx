import {
  Download,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

interface SettingsState {
  autoUpdate: boolean;
  updateInterval: number;
  enableNotifications: boolean;
  debugMode: boolean;
  sandboxMode: boolean;
  blockTracking: boolean;
  customCss: string;
  backupFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
  maxExecutionTime: number;
  enableConsoleLogging: boolean;
}

/**
 * Comprehensive settings panel for ScriptPilot configuration
 */
export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>({
    autoUpdate: true,
    updateInterval: 24,
    enableNotifications: true,
    debugMode: false,
    sandboxMode: true,
    blockTracking: false,
    customCss: '',
    backupFrequency: 'weekly',
    maxExecutionTime: 5000,
    enableConsoleLogging: true,
  });

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportScripts = () => {
    // TODO: Implement export functionality
    toast.success('Scripts exported successfully');
  };

  const handleImportScripts = () => {
    // TODO: Implement import functionality
    toast.success('Scripts imported successfully');
  };

  const handleClearData = () => {
    // TODO: Implement data clearing
    toast.success('Data cleared successfully');
  };

  const handleResetSettings = () => {
    setSettings({
      autoUpdate: true,
      updateInterval: 24,
      enableNotifications: true,
      debugMode: false,
      sandboxMode: true,
      blockTracking: false,
      customCss: '',
      backupFrequency: 'weekly',
      maxExecutionTime: 5000,
      enableConsoleLogging: true,
    });
    toast.success('Settings reset to defaults');
  };

  return (
    <div className='h-full flex flex-col p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <Settings className='h-5 w-5' />
        <h2 className='text-xl font-semibold'>Settings</h2>
      </div>

      <div className='flex-1 overflow-auto'>
        <Tabs defaultValue='general' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
            <TabsTrigger value='advanced'>Advanced</TabsTrigger>
            <TabsTrigger value='data'>Data</TabsTrigger>
          </TabsList>

          <TabsContent value='general' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <RefreshCw className='h-4 w-4' />
                  Updates
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Auto-update scripts</Label>
                    <p className='text-sm text-muted-foreground'>
                      Automatically check for and install script updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoUpdate}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('autoUpdate', checked)
                    }
                  />
                </div>

                {settings.autoUpdate && (
                  <div>
                    <Label htmlFor='update-interval'>
                      Update check interval (hours)
                    </Label>
                    <Input
                      id='update-interval'
                      type='number'
                      value={settings.updateInterval}
                      onChange={e =>
                        updateSetting(
                          'updateInterval',
                          parseInt(e.target.value)
                        )
                      }
                      min='1'
                      max='168'
                      className='w-32'
                    />
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Enable notifications</Label>
                    <p className='text-sm text-muted-foreground'>
                      Show notifications for script events
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('enableNotifications', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Interface</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='custom-css'>Custom CSS</Label>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Add custom CSS to style the ScriptPilot interface
                  </p>
                  <Textarea
                    id='custom-css'
                    value={settings.customCss}
                    onChange={e => updateSetting('customCss', e.target.value)}
                    placeholder='/* Your custom CSS here */'
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='security' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-4 w-4' />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Sandbox mode</Label>
                    <p className='text-sm text-muted-foreground'>
                      Run scripts in isolated sandbox for enhanced security
                    </p>
                  </div>
                  <Switch
                    checked={settings.sandboxMode}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('sandboxMode', checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Block tracking</Label>
                    <p className='text-sm text-muted-foreground'>
                      Prevent scripts from accessing tracking APIs
                    </p>
                  </div>
                  <Switch
                    checked={settings.blockTracking}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('blockTracking', checked)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor='max-execution-time'>
                    Maximum execution time (ms)
                  </Label>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Timeout for script execution to prevent infinite loops
                  </p>
                  <Input
                    id='max-execution-time'
                    type='number'
                    value={settings.maxExecutionTime}
                    onChange={e =>
                      updateSetting(
                        'maxExecutionTime',
                        parseInt(e.target.value)
                      )
                    }
                    min='100'
                    max='30000'
                    className='w-32'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='advanced' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-4 w-4' />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Debug mode</Label>
                    <p className='text-sm text-muted-foreground'>
                      Enable verbose logging and debugging features
                    </p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('debugMode', checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label>Console logging</Label>
                    <p className='text-sm text-muted-foreground'>
                      Log script execution details to browser console
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableConsoleLogging}
                    onCheckedChange={(checked: boolean) =>
                      updateSetting('enableConsoleLogging', checked)
                    }
                  />
                </div>

                <div>
                  <Label>Backup frequency</Label>
                  <p className='text-sm text-muted-foreground mb-2'>
                    How often to automatically backup your scripts
                  </p>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value: any) =>
                      updateSetting('backupFrequency', value)
                    }
                  >
                    <SelectTrigger className='w-48'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='never'>Never</SelectItem>
                      <SelectItem value='daily'>Daily</SelectItem>
                      <SelectItem value='weekly'>Weekly</SelectItem>
                      <SelectItem value='monthly'>Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='data' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Download className='h-4 w-4' />
                  Import & Export
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex gap-3'>
                  <Button
                    onClick={handleExportScripts}
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Export Scripts
                  </Button>
                  <Button
                    onClick={handleImportScripts}
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Upload className='h-4 w-4' />
                    Import Scripts
                  </Button>
                </div>
                <p className='text-sm text-muted-foreground'>
                  Export your scripts as a backup or import scripts from another
                  ScriptPilot installation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-destructive'>
                  <Trash2 className='h-4 w-4' />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex gap-3'>
                  <Button onClick={handleResetSettings} variant='outline'>
                    Reset Settings
                  </Button>
                  <Button onClick={handleClearData} variant='destructive'>
                    Clear All Data
                  </Button>
                </div>
                <p className='text-sm text-muted-foreground'>
                  Warning: These actions cannot be undone. Make sure to export
                  your scripts before clearing data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
