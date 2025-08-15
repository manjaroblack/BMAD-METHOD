/**
 * Updater Service interface and stub.
 *
 * @since 0.2.0
 */
export interface UpdaterService {
  start(): Promise<void>;
}

export class UpdaterServiceStub implements UpdaterService {
  async start(): Promise<void> {
    // no-op stub
  }
}
