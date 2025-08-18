import { effect } from 'deps';
import { crayon, denoTui, denoTuiComponents } from 'deps';
import { APP_NAME, VERSION } from '../main.ts';
import type { ManifestRepository } from '../core/state/manifest_repository.ts';
import {
  createInstallationState,
  type InstallationState,
} from '../core/state/installation_state.ts';
import type { AppServices } from '../core/di.ts';
import { currentView, navigate } from './router.ts';
import type { View } from './views/types.ts';
import { MainMenuView } from './views/MainMenuView.ts';
import { ToolkitMenuView } from './views/ToolkitMenuView.ts';
import { HelpView } from './views/HelpView.ts';

/**
 * TUI Application shell wiring Tui, dynamic header, and global keys.
 *
 * @since 0.2.0
 */
export class TuiApplication {
  /** @internal Root TUI instance for rendering and input handling. */
  readonly tui: denoTui.Tui;
  /** Installation state accessed by header and views. */
  readonly state: InstallationState;
  /** Application service container used by views. */
  readonly services: AppServices;

  /**
   * Construct the TUI application and mount header and views.
   *
   * @param repo - Repository to read installation manifest from.
   * @param services - Application services used by views.
   */
  constructor(repo: ManifestRepository, services: AppServices) {
    this.services = services;
    this.state = createInstallationState(repo);

    this.tui = new denoTui.Tui({
      style: crayon.bgBlack,
      refreshRate: 1000 / 30,
    });

    this.#mountHeader();
    // Mount views
    new MainMenuView({ tui: this.tui, state: this.state, services: this.services });
    new ToolkitMenuView({ tui: this.tui, state: this.state, services: this.services });
    new HelpView({ tui: this.tui, state: this.state, services: this.services });
    this.#wireGlobalKeys();
  }

  #mountHeader(): void {
    const headerText = new denoTui.Signal<string>('');

    // Bridge preact signals -> deno_tui signal
    effect(() => {
      const view: View = currentView.value;
      const installed = this.state.installed.value ? 'Installed' : 'Not installed';
      headerText.value =
        `${APP_NAME} v${VERSION} | View: ${view} | Status: ${installed} | [?] Help  [q] Quit`;
    });

    // Simple header at top-left; auto-size based on text
    new denoTuiComponents.Label({
      parent: this.tui,
      text: headerText,
      rectangle: { column: 1, row: 1 },
      align: { horizontal: 'left', vertical: 'top' },
      theme: { base: crayon.bgBlue.white },
      zIndex: 1000,
    });
  }

  #wireGlobalKeys(): void {
    this.tui.on('keyPress', ({ key }) => {
      if (key === '?') {
        navigate('Help');
      } else if (key === 'q') {
        // Gracefully exit via lifecycle
        this.tui.emit('destroy');
      }
    });
  }

  /**
   * Start the TUI main loop after refreshing installation state.
   *
   * @example
   * const app = new TuiApplication(repo, services);
   * await app.start();
   */
  async start(): Promise<void> {
    // Ensure state is up-to-date before run loop
    await this.state.refresh();

    // Input + controls + lifecycle
    this.tui.dispatch();
    denoTui.handleKeyboardControls(this.tui);
    denoTui.handleMouseControls(this.tui);
    denoTui.handleInput(this.tui);
    this.tui.run();
  }
}
