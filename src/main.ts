// Minimal CLI entry point for BMAD-METHOD
// - Supports --help and --version
// - Uses centralized deps for flags and logging
// - Exports `main` for tests to call without spawning a subprocess

import { log, parseFlags } from 'deps';
import { ToolkitServiceImpl } from './services/toolkit_service.ts';
import { type AppServices, createServices } from './core/di.ts';

/**
 * Canonical application name for CLI output.
 * @since 0.1.0
 */
export const APP_NAME = 'bmad-method';
/**
 * Semantic version of the application.
 * @since 0.1.0
 */
export const VERSION = '0.1.0';

/**
 * Build a human-readable usage help string.
 * @returns Usage text suitable for terminal display.
 * @since 0.1.0
 */
export function getUsage(): string {
  return `\
${APP_NAME} — BMad Method CLI

Usage:
  deno run -A src/main.ts [options]

Options:
  -h, --help        Show help
  -v, --version     Show version
      --toolkit <task> [-- args...]  Run a deno task directly and exit with its code
      --open-config  Open bmad-core/core-config.yaml with system default application\n`;
}

/**
 * Entry point for the BMAD-METHOD CLI.
 *
 * Parses flags and handles common options like `--help` and `--version`.
 * Exposes a programmatic API for testing or embedding without spawning a process.
 *
 * @param opts Optional overrides (e.g., custom print function for testing)
 * @param args Optional argv array; defaults to `Deno.args`
 * @returns Numeric exit code (0 for success)
 * @since 0.1.0
 */
export function main(
  opts?: { print?: (msg: string) => void },
  args?: string[],
): number {
  const print = opts?.print ?? console.log;
  const argv = args ?? Deno.args;
  const flags = parseFlags(argv, {
    boolean: ['help', 'version'],
    alias: { h: 'help', v: 'version' },
  });

  // minimal default logger
  log.setup({
    handlers: { console: new log.ConsoleHandler('INFO', { useColors: true }) },
    loggers: { default: { level: 'INFO', handlers: ['console'] } },
  });

  if (flags.help) {
    print(getUsage());
    return 0;
  }

  if (flags.version) {
    print(`${APP_NAME} v${VERSION}`);
    return 0;
  }

  // Default behavior for now is to show help
  print(getUsage());
  return 0;
}

/** Async CLI entry that supports toolkit bypass. */
export async function mainAsync(
  opts?: {
    print?: (msg: string) => void;
    toolkitExec?: (cmd: string, args: string[]) => Promise<{ code: number }>;
    configProvider?: () => Promise<{ tasks?: Record<string, unknown> } | null>;
    servicesFactory?: () => AppServices;
  },
  args?: string[],
): Promise<number> {
  const print = opts?.print ?? console.log;
  const argv = args ?? Deno.args;
  const flags = parseFlags(argv, {
    boolean: ['help', 'version', 'open-config'],
    string: ['toolkit'],
    alias: { h: 'help', v: 'version' },
  });

  // minimal default logger
  log.setup({
    handlers: { console: new log.ConsoleHandler('INFO', { useColors: true }) },
    loggers: { default: { level: 'INFO', handlers: ['console'] } },
  });

  if (flags.help) {
    print(getUsage());
    return 0;
  }

  if (flags.version) {
    print(`${APP_NAME} v${VERSION}`);
    return 0;
  }

  if (flags['open-config']) {
    try {
      const services = opts?.servicesFactory ? opts.servicesFactory() : createServices();
      const { code } = await services.config.openCoreConfig();
      if (code === 0) {
        print('Opened core-config.yaml');
        return 0;
      }
      print(`Failed to open core-config.yaml (code ${code})`);
      return 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      print(msg);
      return 1;
    }
  }

  const taskName = typeof flags.toolkit === 'string' ? flags.toolkit : undefined;
  if (taskName) {
    // Capture pass-through args after "--" if present
    const ddIndex = argv.indexOf('--');
    const passArgs = ddIndex >= 0 ? ['--', ...argv.slice(ddIndex + 1)] : [];
    try {
      const svc = new ToolkitServiceImpl(opts?.toolkitExec, opts?.configProvider);
      const { code } = await svc.runTask(taskName, passArgs);
      print(`Toolkit task "${taskName}" exited with code ${code}`);
      return code;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      print(msg);
      return 1;
    }
  }

  // Default behavior for now is to show help
  print(getUsage());
  return 0;
}

if (import.meta.main) {
  const code = await mainAsync();
  Deno.exit(code);
}
