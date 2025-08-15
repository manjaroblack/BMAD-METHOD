/**
 * Read-only state adapter mapping Installation Manifest to simple booleans.
 *
 * @since 0.2.0
 */
import { computed, ReadonlySignal, signal } from 'deps';
import type { ManifestRepository } from './manifest_repository.ts';

export interface InstallationState {
  /** Whether the application is considered installed. */
  installed: ReadonlySignal<boolean>;
  /** Manually refresh state from the repository. */
  refresh: () => Promise<void>;
}

/**
 * Create read-only installation state from a `ManifestRepository`.
 */
export function createInstallationState(repo: ManifestRepository): InstallationState {
  const manifestJson = signal<unknown | null>(null);

  const installed = computed<boolean>(() => manifestJson.value !== null);

  async function refresh(): Promise<void> {
    try {
      const m = await repo.readManifest();
      manifestJson.value = m ?? null;
    } catch {
      // In read-only adapter we swallow errors; callers can expose diagnostics if needed
      manifestJson.value = null;
    }
  }

  // Trigger initial load (fire-and-forget)
  // No top-level await here to keep import side-effects minimal; caller can await refresh
  void refresh();

  return { installed, refresh };
}
