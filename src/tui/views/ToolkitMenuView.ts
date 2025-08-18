import { crayon, denoTui, denoTuiComponents, effect } from 'deps';
import type { InstallationState } from '../../core/state/installation_state.ts';
import type { AppServices } from '../../core/di.ts';
import { currentView, navigate } from '../router.ts';

/**
 * Dependencies required to construct `ToolkitMenuView`.
 *
 * @since 0.2.0
 */
export interface ToolkitMenuDeps {
  /** Root TUI instance. */
  tui: denoTui.Tui;
  /** Installation state (reserved for future visibility/permissions). */
  state: InstallationState; // reserved for future use (permissions, status)
  /** Application services providing Toolkit actions. */
  services: AppServices;
}

/**
 * Toolkit Menu View — lists available "deno task" tasks and runs selection.
 *
 * Behavior:
 * - When currentView === 'Toolkit', shows list or empty-state message
 * - Selecting a task runs it via ToolkitService.runTask and prints a minimal status label
 * - Provides a Back button to return to MainMenu
 *
 * @since 0.2.0
 */
export class ToolkitMenuView {
  /** @internal TUI instance this view renders into. */
  readonly tui: denoTui.Tui;
  /** Application services used by this view. */
  readonly services: AppServices;

  /** @internal Title label for the view. */
  readonly title: denoTuiComponents.Label;
  /** @internal Status label displaying last task exit code. */
  readonly status: denoTuiComponents.Label;
  /** @internal Back button to navigate to MainMenu. */
  readonly backButton: denoTuiComponents.Button;
  /** @internal Empty-state label when no tasks are found. */
  readonly emptyLabel: denoTuiComponents.Label;
  /** @internal Dynamically created task buttons. */
  readonly taskButtons: denoTuiComponents.Button[] = [];

  /** Promise resolved when initial task discovery finishes (useful in tests). */
  readonly ready: Promise<void>;
  #resolveReady!: () => void;

  /**
   * Create ToolkitMenuView and mount base components.
   *
   * @param deps - Constructor dependencies.
   */
  constructor({ tui, state: _state, services }: ToolkitMenuDeps) {
    this.tui = tui;
    this.services = services;

    // Resolve center for simple layout
    const centerColumn = new denoTui.Computed(() =>
      Math.max(1, Math.floor(this.tui.rectangle.value.width / 2 - 20))
    );

    const baseTheme = {
      base: crayon.bgBlue.white,
      focused: crayon.bgLightBlue.white,
      active: crayon.bgYellow.black,
    };
    const common = (row: number) => ({
      parent: this.tui,
      theme: baseTheme,
      zIndex: 10,
      rectangle: new denoTui.Computed(() => ({
        column: centerColumn.value,
        row,
        width: 40,
        height: 3,
      })),
    });

    // Visibility signals bridged from Preact signals
    const visible = new denoTui.Signal<boolean>(false);
    effect(() => {
      visible.value = currentView.value === 'Toolkit';
    });

    this.title = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('Toolkit Tasks'),
      rectangle: { column: 2, row: 3 },
      align: { horizontal: 'left', vertical: 'top' },
      theme: { base: crayon.bgBlack.white },
      visible,
      zIndex: 9,
    });

    this.status = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>(''),
      rectangle: { column: 2, row: 5 },
      align: { horizontal: 'left', vertical: 'top' },
      theme: { base: crayon.bgBlack.white },
      visible,
      zIndex: 9,
    });

    this.backButton = new denoTuiComponents.Button({
      ...common(28),
      visible,
      label: { text: 'Back' },
    });
    this.backButton.state.when('active', () => {
      navigate('MainMenu');
    });

    this.emptyLabel = new denoTuiComponents.Label({
      parent: this.tui,
      text: new denoTui.Signal<string>('No tasks found'),
      rectangle: { column: 2, row: 8 },
      align: { horizontal: 'left', vertical: 'top' },
      theme: { base: crayon.bgBlack.white },
      visible,
      zIndex: 9,
    });

    // Initialize async: discover tasks and render buttons
    this.ready = new Promise<void>((resolve) => {
      this.#resolveReady = resolve;
    });
    void this.#init(visible);
  }

  async #init(visible: denoTui.Signal<boolean>): Promise<void> {
    try {
      const tasks = await this.services.toolkit.listTasks();
      // Show empty state when none
      this.emptyLabel.visible = new denoTui.Signal<boolean>(false);
      effect(() => {
        const onToolkit = visible.value;
        const none = tasks.length === 0;
        this.emptyLabel.visible.value = onToolkit && none;
      });

      // Create a vertical list of task buttons (max 10 for simple layout)
      const max = Math.min(10, tasks.length);
      for (let i = 0; i < max; i++) {
        const t = tasks[i];
        if (!t) continue;
        const btn = new denoTuiComponents.Button({
          ...({
            parent: this.tui,
            theme: {
              base: crayon.bgGreen.black,
              focused: crayon.bgLightGreen.black,
              active: crayon.bgYellow.black,
            },
            zIndex: 10,
            rectangle: new denoTui.Computed(() => ({
              column: Math.max(1, Math.floor(this.tui.rectangle.value.width / 2 - 20)),
              row: 10 + i * 3,
              width: 40,
              height: 3,
            })),
          }),
          visible,
          label: { text: t.name },
        });
        btn.state.when('active', async () => {
          const result = await this.services.toolkit.runTask(t.name);
          this.status.text.value = `Task "${t.name}" exited with code ${result.code}`;
        });
        this.taskButtons.push(btn);
      }
    } catch {
      // On discovery failure treat as empty list
      this.emptyLabel.visible = new denoTui.Signal<boolean>(true);
    } finally {
      this.#resolveReady();
    }
  }
}
