/**
 * Installer Service interface and stub.
 * Wires from Main Menu; implementation follows in later stories.
 *
 * @since 0.2.0
 */
export interface InstallerService {
  /** Start installer wizard or workflow. */
  start(): Promise<void>;
}

export class InstallerServiceStub implements InstallerService {
  async start(): Promise<void> {
    // no-op stub
  }
}
