import { assertEquals, signal } from 'deps';
import { denoTui } from 'deps';
import type { AppServices } from '../../src/core/di.ts';
import type { InstallationState } from '../../src/core/state/installation_state.ts';
import { currentView } from '../../src/tui/router.ts';
import { ToolkitMenuView } from '../../src/tui/views/ToolkitMenuView.ts';

function makeServices(): AppServices {
  const services: AppServices = {
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
      openCoreConfig: () => Promise.resolve({ code: 0 }),
    },
  } as AppServices;
  return services;
}

Deno.test({
  name: 'ToolkitMenuView Back button navigates to MainMenu',
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  currentView.value = 'Toolkit';
  const services = makeServices();
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });

  const INITIAL_INSTALLED = false;
  const state: InstallationState = {
    installed: signal(INITIAL_INSTALLED),
    refresh: () => Promise.resolve(),
  };

  const view = new ToolkitMenuView({ tui, state, services });
  await view.ready;

  // Precondition
  assertEquals(currentView.value, 'Toolkit');

  // Simulate Back button activation (two keyboard interactions mirrors existing tests)
  view.backButton.interact('keyboard');
  view.backButton.interact('keyboard');

  // Should navigate back to MainMenu
  assertEquals(currentView.value, 'MainMenu');

  try {
    tui.destroy();
  } catch (_err) { /* ignore destroy errors for Deno 2 compat */ }
});
