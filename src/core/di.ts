import type { InstallerService } from '../services/installer_service.ts';
import { InstallerServiceStub } from '../services/installer_service.ts';
import type { UpdaterService } from '../services/updater_service.ts';
import { UpdaterServiceStub } from '../services/updater_service.ts';
import type { UninstallerService } from '../services/uninstaller_service.ts';
import { UninstallerServiceStub } from '../services/uninstaller_service.ts';
import type { ToolkitService } from '../services/toolkit_service.ts';
import { ToolkitServiceImpl, ToolkitServiceStub } from '../services/toolkit_service.ts';
import type { ConfigService } from '../services/config_service.ts';
import { ConfigServiceImpl, ConfigServiceStub } from '../services/config_service.ts';

/**
 * Application services dependency container.
 *
 * @since 0.2.0
 */
export interface AppServices {
  /** Installer workflow service. */
  installer: InstallerService;
  /** Updater workflow service. */
  updater: UpdaterService;
  /** Uninstaller workflow service. */
  uninstaller: UninstallerService;
  /** Toolkit tasks service. */
  toolkit: ToolkitService;
  /** Config file interactions service. */
  config: ConfigService;
}

/** Simple DI container factory returning stub implementations. */
export function createStubServices(): AppServices {
  return {
    installer: new InstallerServiceStub(),
    updater: new UpdaterServiceStub(),
    uninstaller: new UninstallerServiceStub(),
    toolkit: new ToolkitServiceStub(),
    config: new ConfigServiceStub(),
  };
}

/** DI container factory for production/runtime services. */
export function createServices(): AppServices {
  return {
    installer: new InstallerServiceStub(),
    updater: new UpdaterServiceStub(),
    uninstaller: new UninstallerServiceStub(),
    toolkit: new ToolkitServiceImpl(),
    config: new ConfigServiceImpl(),
  };
}
