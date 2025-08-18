import { assert, assertEquals, signal } from 'deps';
import type { ReadonlySignal } from 'deps';
import { denoTui } from 'deps';
import type { AppServices } from '../../src/core/di.ts';
import type { InstallationState } from '../../src/core/state/installation_state.ts';
import { currentView } from '../../src/tui/router.ts';
import { HelpView } from '../../src/tui/views/HelpView.ts';

function makeServices(): AppServices {
  // Minimal stubs for AppServices; only shapes are required for type-safety in tests
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
  name: 'HelpView visible when currentView === "Help"; hidden otherwise',
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  // Visible when Help
  currentView.value = 'Help';
  const services = makeServices();
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });
  const NOT_INSTALLED = false;
  const installed: ReadonlySignal<boolean> = signal(NOT_INSTALLED);
  const state: InstallationState = { installed, refresh: () => Promise.resolve() };
  const view = new HelpView({ tui, state, services });

  assert(view.title.visible.peek(), 'Title should be visible when in Help view');
  assert(view.keyboardHeader.visible.peek(), 'Keyboard header should be visible');
  assert(view.backButton.visible.peek(), 'Back button should be visible');

  // Hidden when not Help
  currentView.value = 'MainMenu';
  assert(!view.title.visible.peek(), 'Title should be hidden when not in Help view');

  try {
    tui.destroy();
  } catch (_err) { /* ignore destroy errors for Deno 2 compat */ }
});

Deno.test({
  name: 'Back button navigates to MainMenu',
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  currentView.value = 'Help';
  const services = makeServices();
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });
  const NOT_INSTALLED = false;
  const installed: ReadonlySignal<boolean> = signal(NOT_INSTALLED);
  const state: InstallationState = { installed, refresh: () => Promise.resolve() };
  const view = new HelpView({ tui, state, services });

  // Simulate activation (focus -> active)
  view.backButton.interact('keyboard');
  view.backButton.interact('keyboard');

  assertEquals(currentView.value, 'MainMenu');

  try {
    tui.destroy();
  } catch (_err) { /* ignore destroy errors for Deno 2 compat */ }
});
