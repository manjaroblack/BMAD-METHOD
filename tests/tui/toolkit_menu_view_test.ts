import { assert, assertEquals, signal } from 'deps';
import { denoTui } from 'deps';
import type { AppServices } from '../../src/core/di.ts';
import type { InstallationState } from '../../src/core/state/installation_state.ts';
import { currentView } from '../../src/tui/router.ts';
import { ToolkitMenuView } from '../../src/tui/views/ToolkitMenuView.ts';

function makeServices(
  tasks: Array<{ name: string; command: string }>,
  recorder: { ran: string[] },
): AppServices {
  const services: AppServices = {
    installer: { start: () => Promise.resolve() },
    updater: { start: () => Promise.resolve() },
    uninstaller: { start: () => Promise.resolve() },
    toolkit: {
      listTasks: () => Promise.resolve(tasks),
      runTask: (name: string) => {
        recorder.ran.push(name);
        return Promise.resolve({ code: 0 });
      },
      open: () => Promise.resolve(),
    },
    config: {
      getCoreConfigPath: () => '/tmp/core-config.yaml',
      openCoreConfig: () => Promise.resolve({ code: 0 }),
    },
  } as AppServices;
  return services;
}

Deno.test({
  name: 'ToolkitMenuView shows empty state when no tasks',
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  currentView.value = 'Toolkit';
  const recorder = { ran: [] as string[] };
  const services = makeServices([], recorder);
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });

  const INITIAL_INSTALLED = false;
  const state: InstallationState = {
    installed: signal(INITIAL_INSTALLED),
    refresh: () => Promise.resolve(),
  };
  const view = new ToolkitMenuView({ tui, state, services });
  await view.ready;

  assertEquals(view.taskButtons.length, 0);
  assert(view.emptyLabel.visible.peek(), 'Empty label should be visible');

  try {
    tui.destroy();
  } catch (_err) { /* ignore destroy errors for Deno 2 compat */ }
});

Deno.test({
  name: 'ToolkitMenuView lists tasks and runs selected',
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  currentView.value = 'Toolkit';
  const recorder = { ran: [] as string[] };
  const services = makeServices([
    { name: 'lint', command: 'deno lint' },
    { name: 'test', command: 'deno test' },
  ], recorder);
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });

  const INITIAL_INSTALLED = false;
  const state: InstallationState = {
    installed: signal(INITIAL_INSTALLED),
    refresh: () => Promise.resolve(),
  };
  const view = new ToolkitMenuView({ tui, state, services });
  await view.ready;

  assertEquals(view.taskButtons.length, 2);
  assert(!view.emptyLabel.visible.peek(), 'Empty label should be hidden');

  // Simulate pressing the first task button
  const [btn] = view.taskButtons;
  assert(btn, 'expected first task button');
  btn.interact('keyboard');
  btn.interact('keyboard');

  // Ensure runTask was called
  assertEquals(recorder.ran, ['lint']);

  try {
    tui.destroy();
  } catch (_err) { /* ignore destroy errors for Deno 2 compat */ }
});
