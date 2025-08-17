/**
 * Config Service for interacting with core configuration files.
 *
 * Focus: bmad-core/core-config.yaml
 *
 * Permissions:
 * - getCoreConfigPath(): no permissions required
 * - openCoreConfig(): requires --allow-read (existence check) and --allow-run (spawn opener)
 *
 * @since 0.3.0
 */
export interface ConfigService {
  /** Absolute path to bmad-core/core-config.yaml resolved from repo root. */
  getCoreConfigPath(): string;

  /**
   * Open the core config file with the system default application.
   *
   * Success resolves with { code: 0 }
   * Failures reject with an Error that contains an actionable message.
   *
   * @example
   * // deno run --allow-read --allow-run src/main.ts --open-config
   * const { code } = await config.openCoreConfig();
   */
  openCoreConfig(): Promise<{ code: number }>;
}

import { path } from 'deps';

/** Concrete ConfigService implementation. */
export class ConfigServiceImpl implements ConfigService {
  constructor(
    private readonly opener?: (target: string) => Promise<{ code: number }>,
    private readonly existsFn?: (p: string) => Promise<boolean>,
    private readonly platform: string = Deno.build.os,
    private readonly rootDir: string = Deno.cwd(),
  ) {}

  getCoreConfigPath(): string {
    return path.join(this.rootDir, 'bmad-core', 'core-config.yaml');
  }

  async openCoreConfig(): Promise<{ code: number }> {
    const file = this.getCoreConfigPath();

    // 1) Check existence
    try {
      const exists = await (this.existsFn ?? defaultExists)(file);
      if (!exists) {
        throw new Error(`core-config.yaml not found at ${file}`);
      }
    } catch (err) {
      if (err instanceof Deno.errors.PermissionDenied) {
        throw new Error(
          `Permission denied while checking ${file}. Include --allow-read (and --allow-run for opener).`,
        );
      }
      if (err instanceof Error) throw err;
      throw new Error(String(err));
    }

    // 2) Open with system default
    try {
      const run = this.opener ?? defaultOpener(this.platform);
      const { code } = await run(file);
      if (code !== 0) {
        throw new Error(`Failed to open core-config.yaml (code ${code})`);
      }
      return { code };
    } catch (err) {
      if (err instanceof Deno.errors.PermissionDenied) {
        throw new Error(
          `Permission denied while launching opener. Include --allow-run (and --allow-read).`,
        );
      }
      if (err instanceof Error) throw err;
      throw new Error(String(err));
    }
  }
}

export class ConfigServiceStub implements ConfigService {
  getCoreConfigPath(): string {
    return path.join(Deno.cwd(), 'bmad-core', 'core-config.yaml');
  }
  openCoreConfig(): Promise<{ code: number }> {
    // No-op success by default.
    return Promise.resolve({ code: 0 });
  }
}

async function defaultExists(p: string): Promise<boolean> {
  try {
    const info = await Deno.stat(p);
    return info.isFile;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
}

function defaultOpener(platform: string): (target: string) => Promise<{ code: number }> {
  return (target: string): Promise<{ code: number }> => {
    if (platform === 'darwin') {
      return run('open', [target]);
    }
    if (platform === 'windows') {
      return run('cmd', ['/c', 'start', '', target]);
    }
    // linux and other unix-like platforms
    return run('xdg-open', [target]);
  };
}

async function run(cmd: string, args: string[]): Promise<{ code: number }> {
  const p = new Deno.Command(cmd, {
    args,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await p.spawn().status;
  return { code: status.code };
}
