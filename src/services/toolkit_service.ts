/**
 * Toolkit Service interface and stub.
 *
 * @since 0.2.0
 */
export interface ToolkitService {
  /** Open toolkit tasks UI or perform default action. */
  open(): Promise<void>;
}

export class ToolkitServiceStub implements ToolkitService {
  async open(): Promise<void> {
    // no-op stub
  }
}
