import { assertEquals, assertStringIncludes } from 'deps';
import { mainAsync } from '../../src/main.ts';
import type { AppServices } from '../../src/core/di.ts';

Deno.test('CLI --open-config prints success and exits 0', async () => {
  const out: string[] = [];
  const calls: string[] = [];
  const servicesFactory = (): AppServices => ({
    installer: { start: () => Promise.resolve() },
    updater: { start: () => Promise.resolve() },
    uninstaller: { start: () => Promise.resolve() },
    toolkit: {
      listTasks: () => Promise.resolve([]),
      runTask: (_name: string) => Promise.resolve({ code: 0 }),
      open: () => Promise.resolve(),
    },
    config: {
      getCoreConfigPath: () => '/tmp/core-config.yaml',
      openCoreConfig: () => {
        calls.push('open');
        return Promise.resolve({ code: 0 });
      },
    },
  } as AppServices);

  const code = await mainAsync({ print: (m) => out.push(String(m)), servicesFactory }, [
    '--open-config',
  ]);

  assertEquals(code, 0);
  assertStringIncludes(out.join('\n'), 'Opened core-config.yaml');
  assertEquals(calls, ['open']);
});

Deno.test('CLI --open-config prints actionable error and exits 1 on failure', async () => {
  const out: string[] = [];
  const servicesFactory = (): AppServices => ({
    installer: { start: () => Promise.resolve() },
    updater: { start: () => Promise.resolve() },
    uninstaller: { start: () => Promise.resolve() },
    toolkit: {
      listTasks: () => Promise.resolve([]),
      runTask: (_name: string) => Promise.resolve({ code: 0 }),
      open: () => Promise.resolve(),
    },
    config: {
      getCoreConfigPath: () => '/tmp/core-config.yaml',
      openCoreConfig: () => {
        return Promise.reject(new Error('core-config.yaml not found at /tmp/core-config.yaml'));
      },
    },
  } as AppServices);

  const code = await mainAsync({ print: (m) => out.push(String(m)), servicesFactory }, [
    '--open-config',
  ]);

  assertEquals(code, 1);
  const stdout = out.join('\n');
  assertStringIncludes(stdout, 'core-config.yaml not found');
});
