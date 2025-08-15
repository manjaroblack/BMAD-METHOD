import type { InstallerService } from '../services/installer_service.ts';
import { InstallerServiceStub } from '../services/installer_service.ts';
import type { UpdaterService } from '../services/updater_service.ts';
import { UpdaterServiceStub } from '../services/updater_service.ts';
import type { UninstallerService } from '../services/uninstaller_service.ts';
import { UninstallerServiceStub } from '../services/uninstaller_service.ts';
import type { ToolkitService } from '../services/toolkit_service.ts';
import { ToolkitServiceStub } from '../services/toolkit_service.ts';

export interface AppServices {
  installer: InstallerService;
  updater: UpdaterService;
  uninstaller: UninstallerService;
  toolkit: ToolkitService;
}

/** Simple DI container factory returning stub implementations. */
export function createStubServices(): AppServices {
  return {
    installer: new InstallerServiceStub(),
    updater: new UpdaterServiceStub(),
    uninstaller: new UninstallerServiceStub(),
    toolkit: new ToolkitServiceStub(),
  };
}
