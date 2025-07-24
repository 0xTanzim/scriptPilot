// Simple test to verify core package exports
import {
  GMAPIProvider,
  MetadataParser,
  ScriptService,
  ScriptValidator,
  ScriptWorkerManager,
} from '@scriptpilot/core';

// Test that all exports are available
console.log('✅ ScriptService:', typeof ScriptService);
console.log('✅ ScriptValidator:', typeof ScriptValidator);
console.log('✅ MetadataParser:', typeof MetadataParser);
console.log('✅ GMAPIProvider:', typeof GMAPIProvider);
console.log('✅ ScriptWorkerManager:', typeof ScriptWorkerManager);

export {};
