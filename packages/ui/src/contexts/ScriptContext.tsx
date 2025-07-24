import { Script } from '@scriptpilot/types';
import React, { createContext, ReactNode, useContext } from 'react';

interface ScriptContextValue {
  scripts: Script[];
  currentUrl: string;
  currentTitle: string;
  scriptStatus: Array<{ enabled: boolean; id: string }>;
  mode: 'popup' | 'fullscreen';
  onScriptSave?: (script: Script) => Promise<void>;
  onScriptDelete?: (scriptId: string) => Promise<void>;
  onScriptToggle?: (scriptId: string, enabled: boolean) => Promise<void>;
  onScriptInstall?: (url: string) => Promise<void>;
  onOpenSettings?: () => void;
  onOpenEditor?: (scriptId?: string) => void;
}

const ScriptContext = createContext<ScriptContextValue | undefined>(undefined);

export const useScriptContext = () => {
  const context = useContext(ScriptContext);
  if (!context) {
    throw new Error('useScriptContext must be used within a ScriptProvider');
  }
  return context;
};

interface ScriptProviderProps {
  children: ReactNode;
  value: ScriptContextValue;
}

export const ScriptProvider: React.FC<ScriptProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>
  );
};

export { ScriptContext };
