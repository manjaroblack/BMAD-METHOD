/**
 * Toolkit Service interface and stub.
 *
 * @since 0.2.0
 */
export interface ToolkitService {
  /**
   * Discover project tasks from root deno.json/deno.jsonc.
   *
   * Edge cases:
   * - Missing or unreadable config => returns []
   * - Empty tasks map => returns []
   *
   * @example
   * // Requires --allow-read for discovery
   * const tasks = await toolkit.listTasks();
   *
   * @returns Array of task descriptors with name and mapped command
   */
  listTasks(): Promise<Array<{ name: string; command: string }>>;

  /**
   * Run a known task using `deno task <name> [-- args...]` and propagate exit code.
   *
   * Unknown task must reject with a clear error listing available tasks.
   *
   * @example
   * // Requires --allow-run to spawn and --allow-read for discovery
   * const { code } = await toolkit.runTask('test', ['--', '--fail-fast']);
   */
  runTask(name: string, args?: string[]): Promise<{ code: number }>;

  /** Open toolkit tasks UI or perform default action (used by TUI button). */
  open(): Promise<void>;
}

import { parseJsonc, path } from 'deps';

/** Concrete ToolkitService implementation. */
export class ToolkitServiceImpl implements ToolkitService {
  constructor(
    private readonly exec?: (cmd: string, args: string[]) => Promise<{ code: number }>,
    private readonly configProvider?: () => Promise<{ tasks?: Record<string, unknown> } | null>,
    private readonly rootDir: string = Deno.cwd(),
  ) {}

  async listTasks(): Promise<Array<{ name: string; command: string }>> {
    const cfg = await this.#readRootConfig();
    if (!cfg) return [];
    const tasks = cfg.tasks;
    if (!tasks || typeof tasks !== 'object') return [];
    const out: Array<{ name: string; command: string }> = [];
    for (const [name, command] of Object.entries(tasks)) {
      if (typeof name === 'string' && typeof command === 'string') out.push({ name, command });
    }
    return out;
  }

  async runTask(name: string, args: string[] = []): Promise<{ code: number }> {
    const tasks = await this.listTasks();
    const known = new Set(tasks.map((t) => t.name));
    if (!known.has(name)) {
      const suggestions = tasks.map((t) => t.name).sort().join(', ');
      throw new Error(
        suggestions.length > 0
          ? `Unknown task: ${name}. Available tasks: ${suggestions}`
          : `Unknown task: ${name}. No tasks found.`,
      );
    }

    const runner = this.exec ?? (async (cmd: string, argv: string[]) => {
      const p = new Deno.Command(cmd, {
        args: argv,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
      });
      const status = await p.spawn().status;
      return { code: status.code };
    });

    // Always delegate via `deno task` to respect config mapping
    const result = await runner('deno', ['task', name, ...args]);
    return { code: result.code };
  }

  async open(): Promise<void> {
    // No-op default for now; Toolkit UI handles rendering via view
  }

  async #readRootConfig(): Promise<{ tasks?: Record<string, unknown> } | null> {
    // Allow tests to inject a provider to avoid FS permissions
    if (this.configProvider) {
      try {
        const provided = await this.configProvider();
        if (provided && typeof provided === 'object') return provided;
      } catch {
        // ignore and fall through to FS
      }
    }

    // Prefer deno.jsonc then deno.json (sequential, not inside a loop)
    const jsoncPath = path.join(this.rootDir, 'deno.jsonc');
    try {
      const text = await Deno.readTextFile(jsoncPath);
      const data = parseJsonc(text);
      if (data && typeof data === 'object') return data as { tasks?: Record<string, unknown> };
    } catch {
      // ignore
    }

    const jsonPath = path.join(this.rootDir, 'deno.json');
    try {
      const text = await Deno.readTextFile(jsonPath);
      const data = JSON.parse(text);
      if (data && typeof data === 'object') return data as { tasks?: Record<string, unknown> };
    } catch {
      // ignore
    }

    return null;
  }
}

export class ToolkitServiceStub implements ToolkitService {
  listTasks(): Promise<Array<{ name: string; command: string }>> {
    return Promise.resolve([]);
  }
  runTask(_name: string, _args: string[] = []): Promise<{ code: number }> {
    return Promise.reject(new Error('Unknown task'));
  }
  async open(): Promise<void> {
    // no-op stub
  }
}
