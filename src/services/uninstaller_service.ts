/**
 * Uninstaller Service interface and stub.
 *
 * @since 0.2.0
 */
export interface UninstallerService {
  /** Start uninstaller workflow. */
  start(): Promise<void>;
}

/**
 * No-op stub for `UninstallerService` used in tests and when uninstaller
 * implementation is not available.
 *
 * @since 0.2.0
 */
export class UninstallerServiceStub implements UninstallerService {
  /** Start the uninstaller workflow (no-op in stub). */
  async start(): Promise<void> {
    // no-op stub
  }
}
