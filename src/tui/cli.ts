import '../shims/deno_compat.ts';
import { parseFlags } from 'deps';
import type { ManifestRepository, InstallationManifest } from '../core/state/manifest_repository.ts';
import { createStubServices } from '../core/di.ts';
import { TuiApplication } from './TuiApplication.ts';

class CliManifestRepository implements ManifestRepository {
  constructor(private manifestPath?: string) {}

  async readManifest(): Promise<InstallationManifest | null> {
    if (!this.manifestPath) return null; // treat as fresh install when not provided
    try {
      const text = await Deno.readTextFile(this.manifestPath);
      const data = JSON.parse(text);
      // Map common schema fields (see docs/project/architecture/data-models.md)
      const version: unknown = data.core?.version ?? data.version;
      const installedOn: unknown = data.core?.installedOn ?? data.installedAt;
      const maybeId: unknown = data.id ?? data.core?.id;

      const result: InstallationManifest = {};
      if (typeof maybeId === 'string') result.id = maybeId;
      if (typeof version === 'string') result.version = version;
      if (typeof installedOn === 'string') result.installedAt = installedOn;
      return result;
    } catch {
      // If file not readable or invalid JSON, treat as not installed
      return null;
    }
  }
}

export async function runTui(options: { manifestPath?: string } = {}): Promise<void> {
  const repo = new CliManifestRepository(options.manifestPath);
  const services = createStubServices();
  const app = new TuiApplication(repo, services);
  await app.start();
}

// Allow direct execution: deno run -A src/tui/cli.ts --manifest=path
if (import.meta.main) {
  const flags = parseFlags(Deno.args, { string: ['manifest'], alias: { m: 'manifest' } });
  const manifest = typeof flags.manifest === 'string' && flags.manifest.length > 0
    ? flags.manifest
    : undefined;
  // Fire and await so process lifecycle is tied to TUI
  await runTui(manifest ? { manifestPath: manifest } : {});
}
