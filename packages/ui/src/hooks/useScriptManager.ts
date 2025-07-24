import { Script } from '@scriptpilot/types';
import { useCallback, useEffect, useState } from 'react';
import { useScriptContext } from '../contexts/ScriptContext';

/**
 * Custom Hook for Script Management
 * Following Design Pattern #5: Hooks & Logic Abstraction
 * Separates business logic from UI components
 */
export const useScriptManager = () => {
  const context = useScriptContext();
  const [selectedScript, setSelectedScript] = useState<Script | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  // Memoized script operations
  const updateScript = useCallback(
    async (script: Script) => {
      try {
        if (context.onScriptSave) {
          await context.onScriptSave(script);
        }
        // Update selected script to reflect changes immediately
        setSelectedScript(script);
        return { success: true };
      } catch (error) {
        console.error('Failed to update script:', error);
        return { success: false, error };
      }
    },
    [context]
  );

  const deleteScript = useCallback(
    async (scriptId: string) => {
      try {
        if (context.onScriptDelete) {
          await context.onScriptDelete(scriptId);
        }
        // Clear selection if deleted script was selected
        if (selectedScript?.id === scriptId) {
          setSelectedScript(undefined);
        }
        return { success: true };
      } catch (error) {
        console.error('Failed to delete script:', error);
        return { success: false, error };
      }
    },
    [context, selectedScript?.id]
  );

  const toggleScript = useCallback(
    async (scriptId: string, enabled: boolean) => {
      try {
        if (context.onScriptToggle) {
          await context.onScriptToggle(scriptId, enabled);
        }
        // Update selected script if it's the one being toggled
        if (selectedScript?.id === scriptId) {
          setSelectedScript(prev => (prev ? { ...prev, enabled } : undefined));
        }
        return { success: true };
      } catch (error) {
        console.error('Failed to toggle script:', error);
        return { success: false, error };
      }
    },
    [context, selectedScript?.id]
  );

  // Sync selected script with context when scripts change
  useEffect(() => {
    if (selectedScript && context.scripts.length > 0) {
      const updatedScript = context.scripts.find(
        s => s.id === selectedScript.id
      );
      if (
        updatedScript &&
        JSON.stringify(updatedScript) !== JSON.stringify(selectedScript)
      ) {
        setSelectedScript(updatedScript);
      }
    }
  }, [context.scripts, selectedScript]);

  return {
    scripts: context.scripts,
    selectedScript,
    setSelectedScript,
    isEditing,
    setIsEditing,
    updateScript,
    deleteScript,
    toggleScript,
    scriptStatus: context.scriptStatus,
    mode: context.mode,
  };
};

export default useScriptManager;
