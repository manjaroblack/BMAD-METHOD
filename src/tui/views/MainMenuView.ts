import { denoTui, denoTuiComponents, crayon, effect } from 'deps';
import type { InstallationState } from '../../core/state/installation_state.ts';
import type { AppServices } from '../../core/di.ts';
import { currentView, navigate } from '../router.ts';

export interface MainMenuDeps {
  tui: denoTui.Tui;
  state: InstallationState;
  services: AppServices;
}

export class MainMenuView {
  readonly tui: denoTui.Tui;
  readonly state: InstallationState;
  readonly services: AppServices;

  readonly installButton: denoTuiComponents.Button;
  readonly updateButton: denoTuiComponents.Button;
  readonly uninstallButton: denoTuiComponents.Button;
  readonly toolkitButton: denoTuiComponents.Button;

  constructor({ tui, state, services }: MainMenuDeps) {
    this.tui = tui;
    this.state = state;
    this.services = services;

    const centerColumn = new denoTui.Computed(() => Math.max(1, Math.floor(this.tui.rectangle.value.width / 2 - 12)));

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
        width: 24,
        height: 3,
      })),
    });

    // Visible signals bridged from Preact signals
    const installVisible = new denoTui.Signal<boolean>(false);
    const updateVisible = new denoTui.Signal<boolean>(false);
    const uninstallVisible = new denoTui.Signal<boolean>(false);
    const toolkitVisible = new denoTui.Signal<boolean>(false);

    // Bridge visibility from app state
    effect(() => {
      const onMain = currentView.value === 'MainMenu';
      const isInstalled = this.state.installed.value;
      installVisible.value = onMain && !isInstalled;
      updateVisible.value = onMain && isInstalled;
      uninstallVisible.value = onMain && isInstalled;
      toolkitVisible.value = onMain;
    });

    this.installButton = new denoTuiComponents.Button({
      ...common(4),
      visible: installVisible,
      label: { text: 'Install' },
    });
    this.installButton.state.when('active', () => {
      navigate('InstallerWizard');
      void this.services.installer.start();
    });

    this.updateButton = new denoTuiComponents.Button({
      ...common(8),
      visible: updateVisible,
      label: { text: 'Update' },
    });
    this.updateButton.state.when('active', () => {
      navigate('Updater');
      void this.services.updater.start();
    });

    this.uninstallButton = new denoTuiComponents.Button({
      ...common(12),
      visible: uninstallVisible,
      label: { text: 'Uninstall' },
    });
    this.uninstallButton.state.when('active', () => {
      navigate('Uninstaller');
      void this.services.uninstaller.start();
    });

    this.toolkitButton = new denoTuiComponents.Button({
      ...common(16),
      visible: toolkitVisible,
      label: { text: 'Toolkit' },
    });
    this.toolkitButton.state.when('active', () => {
      navigate('Toolkit');
      void this.services.toolkit.open();
    });
  }
}
