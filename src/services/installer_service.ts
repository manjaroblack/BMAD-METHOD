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

/**
 * No-op stub for `InstallerService` used in tests and placeholder runtime.
 *
 * @since 0.2.0
 */
export class InstallerServiceStub implements InstallerService {
  /** Start installer workflow (no-op). */
  async start(): Promise<void> {
    // no-op stub
  }
}
