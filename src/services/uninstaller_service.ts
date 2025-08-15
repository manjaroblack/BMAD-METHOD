/**
 * Uninstaller Service interface and stub.
 *
 * @since 0.2.0
 */
export interface UninstallerService {
  start(): Promise<void>;
}

export class UninstallerServiceStub implements UninstallerService {
  async start(): Promise<void> {
    // no-op stub
  }
}
