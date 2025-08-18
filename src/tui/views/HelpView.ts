import { crayon, denoTui, denoTuiComponents, effect } from 'deps';
import type { InstallationState } from '../../core/state/installation_state.ts';
import type { AppServices } from '../../core/di.ts';
import { currentView, navigate } from '../router.ts';

/**
 * Dependencies required to construct `HelpView`.
 *
 * @since 0.2.0
 */
export interface HelpViewDeps {
  /** Root TUI instance the view mounts its components into. */
  tui: denoTui.Tui;
  /** Installation state; reserved for future conditional content/visibility. */
  state: InstallationState;
  /** Application services; reserved for future actions triggered from Help. */
  services: AppServices;
}

/**
 * Help View — in-app quick reference for navigation and shortcuts.
 *
 * Behavior:
 * - Visible only when `currentView === 'Help'`
 * - Shows title, sections (Keyboard, Navigation, Quick Commands), footer, and Back button
 * - Back button navigates to `MainMenu`
 *
 * @example
 * ```ts
 * import { denoTui } from 'deps';
 * import { signal } from 'deps';
 * import { currentView, navigate } from '../../src/tui/router.ts';
 * import { createInstallationState } from '../../src/core/state/installation_state.ts';
 * import { HelpView } from '../../src/tui/views/HelpView.ts';
 *
 * // Simulate environment
 * const tui = new denoTui.Tui({ refreshRate: 1000 / 60 });
 * currentView.value = 'Help';
 * // Minimal state stub
 * const state = { installed: signal(false), refresh: () => Promise.resolve() } as any;
 * const services = {} as any;
 * const view = new HelpView({ tui, state, services });
 * // Navigate back
 * navigate('MainMenu');
 * ```
 * @since 0.2.0
 */
export class HelpView {
  /** Underlying TUI instance used by this view. */
  readonly tui: denoTui.Tui;
  /** Application services container. */
  readonly services: AppServices;

  /** Title label component. */
  readonly title: denoTuiComponents.Label;
  /** "Keyboard Shortcuts" section header. */
  readonly keyboardHeader: denoTuiComponents.Label;
  /** Keyboard shortcuts list content. */
  readonly keyboardContent: denoTuiComponents.Label;
  /** "Navigation" section header. */
  readonly navHeader: denoTuiComponents.Label;
  /** Navigation description content. */
  readonly navContent: denoTuiComponents.Label;
  /** "Quick Commands" section header. */
  readonly quickHeader: denoTuiComponents.Label;
  /** CLI quick commands content. */
  readonly quickContent: denoTuiComponents.Label;
  /** Footer label with guide hints. */
  readonly footer: denoTuiComponents.Label;
  /** Back button which navigates to MainMenu. */
  readonly backButton: denoTuiComponents.Button;

  /**
   * Create HelpView and mount its subcomponents.
   *
   * @param deps - Dependencies required to construct the view.
   */
  constructor({ tui, state: _state, services }: HelpViewDeps) {
    this.tui = tui;
    this.services = services;

    const centerColumn = new denoTui.Computed(() =>
      Math.max(1, Math.floor(this.tui.rectangle.value.width / 2 - 30))
    );

    const baseTheme = {
      base: crayon.bgBlue.white,
      focused: crayon.bgLightBlue.white,
      active: crayon.bgYellow.black,
    };

    const sectionHeaderTheme = { base: crayon.bgBlack.white };
    const sectionTextTheme = { base: crayon.reset.white };

    // Helper: rectangle for Label (width/height optional in type)
    const labelRect = (row: number, width = 60, height = 3) =>
      new denoTui.Computed<denoTuiComponents.LabelRectangle>(() => ({
        column: centerColumn.value,
        row,
        width,
        height,
      }));
    // Helper: rectangle for Button/Component (width/height required)
    const componentRect = (row: number, width = 16, height = 3) =>
      new denoTui.Computed<denoTui.Rectangle>(() => ({
        column: centerColumn.value,
        row,
        width,
        height,
      }));

    // Visibility bridged from Preact signals
    const visible = new denoTui.Signal<boolean>(false);
    effect(() => {
      visible.value = currentView.value === 'Help';
    });

    // Title
    this.title = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('Help'),
      rectangle: { column: 2, row: 3 },
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionHeaderTheme,
      visible,
      zIndex: 9,
    });

    // Keyboard Section
    this.keyboardHeader = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('Keyboard Shortcuts'),
      rectangle: labelRect(6),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionHeaderTheme,
      visible,
      zIndex: 9,
    });
    this.keyboardContent = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>(
        '  ? Help  |  q Quit  |  Arrows/Tab Move  |  Enter Activate',
      ),
      rectangle: labelRect(8),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionTextTheme,
      visible,
      zIndex: 9,
    });

    // Navigation Section
    this.navHeader = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('Navigation'),
      rectangle: labelRect(11),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionHeaderTheme,
      visible,
      zIndex: 9,
    });
    this.navContent = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>(
        '  Main Menu  |  Toolkit  |  Back returns to Main Menu',
      ),
      rectangle: labelRect(13),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionTextTheme,
      visible,
      zIndex: 9,
    });

    // Quick Commands Section
    this.quickHeader = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('Quick Commands (CLI)'),
      rectangle: labelRect(16),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionHeaderTheme,
      visible,
      zIndex: 9,
    });
    this.quickContent = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>(
        '  Toolkit: deno run -A src/main.ts --toolkit <task> -- -- <args>\n' +
          '  Open Config: deno run -A src/main.ts --open-config\n' +
          '  TUI: deno task tui',
      ),
      rectangle: labelRect(18, 60, 5),
      align: { horizontal: 'left', vertical: 'top' },
      theme: sectionTextTheme,
      visible,
      zIndex: 9,
    });

    // Footer with guide hints
    this.footer = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>(
        'See: Guides > TUI and Guides > Toolkit for more details',
      ),
      rectangle: labelRect(24),
      align: { horizontal: 'left', vertical: 'top' },
      theme: { base: crayon.bgBlack.white },
      visible,
      zIndex: 9,
    });

    // Back button
    this.backButton = new denoTuiComponents.Button({
      parent: this.tui,
      theme: baseTheme,
      zIndex: 10,
      rectangle: componentRect(28, 16, 3),
      visible,
      label: { text: 'Back' },
    });
    this.backButton.state.when('active', () => {
      navigate('MainMenu');
    });
  }
}
