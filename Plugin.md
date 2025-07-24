# ScriptPilot Plugin Development

**ScriptPilot** supports plugins for custom APIs or UI panels, enhancing extensibility.

## Plugin Structure

```typescript
import { ScriptService } from '@ScriptPilot/core';

export interface Plugin {
  name: string;
  register: (scriptService: ScriptService) => Promise<void>;
}
```

## Creating a Plugin

1.  Create in `packages/plugins/src/<plugin-name>`:

    ```typescript
    // packages/plugins/src/example/index.ts
    import { Plugin, ScriptService } from '@ScriptPilot/core';

    export const ExamplePlugin: Plugin = {
      name: 'example',
      async register(scriptService: ScriptService) {
        console.log('Example plugin registered');
      },
    };
    ```

2.  Register:

    ```typescript
    import { PluginRegistry } from '@ScriptPilot/plugins';
    import { ExamplePlugin } from '@ScriptPilot/plugins/example';

    const registry = new PluginRegistry();
    registry.register(ExamplePlugin);
    ```

## Examples

- **Custom API**: Add `GM_log`.
- **UI Panel**: Add a settings panel.

## Testing

```typescript
// packages/plugins/tests/example.test.ts
import { ExamplePlugin } from '../src/example';
describe('ExamplePlugin', () => {
  it('registers correctly', async () => {
    const scriptService = {} as any;
    await ExamplePlugin.register(scriptService);
    expect(console.log).toHaveBeenCalledWith('Example plugin registered');
  });
});
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md).
