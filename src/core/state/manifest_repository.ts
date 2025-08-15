/**
 * Read-only Installation Manifest access.
 * Implementations should read from the filesystem or other sources without writing.
 *
 * @since 0.2.0
 */
export interface ManifestRepository {
  /**
   * Read the current installation manifest if present.
   * Returns null when not installed (fresh system).
   */
  readManifest(): Promise<InstallationManifest | null>;
}

/** Minimal shape to detect installation status for this story. */
export interface InstallationManifest {
  /** Unique id for the installation (optional for this story). */
  id?: string;
  /** Version of the installed toolkit/application. */
  version?: string;
  /** ISO timestamp for when install occurred. */
  installedAt?: string;
}
