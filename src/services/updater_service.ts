/**
 * Updater Service interface and stub.
 *
 * @since 0.2.0
 */
export interface UpdaterService {
  /** Start updater workflow or routine. */
  start(): Promise<void>;
}

/**
 * No-op stub for `UpdaterService` used for tests and wiring.
 *
 * @since 0.2.0
 */
export class UpdaterServiceStub implements UpdaterService {
  /** Start the updater (no-op in stub). */
  async start(): Promise<void> {
    // no-op stub
  }
}
