import { assert, assertEquals } from 'deps';
import { denoTui } from 'deps';
import { createStubServices } from '../../src/core/di.ts';
import type { ManifestRepository, InstallationManifest } from '../../src/core/state/manifest_repository.ts';
import { createInstallationState } from '../../src/core/state/installation_state.ts';
import { MainMenuView } from '../../src/tui/views/MainMenuView.ts';
import { currentView } from '../../src/tui/router.ts';

class StubManifestRepo implements ManifestRepository {
  constructor(private manifest: InstallationManifest | null) {}
  readManifest(): Promise<InstallationManifest | null> {
    return Promise.resolve(this.manifest);
  }
}

Deno.test({ name: 'Main Menu visibility — fresh install', sanitizeOps: false, sanitizeResources: false }, async () => {
  // Arrange: fresh system (no manifest)
  currentView.value = 'MainMenu';
  const repo = new StubManifestRepo(null);
  const state = createInstallationState(repo);
  await state.refresh();

  const services = createStubServices();
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });
  const view = new MainMenuView({ tui, state, services });

  // Assert visibility
  assert(view.installButton.visible.peek(), 'Install should be visible on fresh install');
  assert(!view.updateButton.visible.peek(), 'Update should be hidden on fresh install');
  assert(!view.uninstallButton.visible.peek(), 'Uninstall should be hidden on fresh install');
  assert(view.toolkitButton.visible.peek(), 'Toolkit should be visible on fresh install');

  // Cleanup (guard for Deno 2 where Deno.writeSync may not exist)
  try {
    tui.destroy();
  } catch {
    // ignore
  }
});

Deno.test({ name: 'Routing updates — activate buttons changes currentView', sanitizeOps: false, sanitizeResources: false }, async () => {
  // Arrange: installed system
  currentView.value = 'MainMenu';
  const repo = new StubManifestRepo({ id: 'x', version: '1.0.0', installedAt: new Date().toISOString() });
  const state = createInstallationState(repo);
  await state.refresh();

  const services = createStubServices();
  const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });
  const view = new MainMenuView({ tui, state, services });

  // Update visible; Install hidden when installed
  assert(!view.installButton.visible.peek(), 'Install should be hidden when installed');
  assert(view.updateButton.visible.peek(), 'Update should be visible when installed');
  assert(view.uninstallButton.visible.peek(), 'Uninstall should be visible when installed');
  assert(view.toolkitButton.visible.peek(), 'Toolkit should be visible when installed');

  // Act: simulate activation by interacting twice (focus -> active)
  view.updateButton.interact('keyboard');
  view.updateButton.interact('keyboard');

  // Assert routing
  assertEquals(currentView.value, 'Updater');

  // Cleanup (guard for Deno 2 where Deno.writeSync may not exist)
  try {
    tui.destroy();
  } catch {
    // ignore
  }
});
