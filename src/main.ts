// Minimal CLI entry point for BMAD-METHOD
// - Supports --help and --version
// - Uses centralized deps for flags and logging
// - Exports `main` for tests to call without spawning a subprocess

import { log, parseFlags } from 'deps';

export const APP_NAME = 'bmad-method';
export const VERSION = '0.1.0';

export function getUsage(): string {
  return `\
${APP_NAME} — BMad Method CLI

Usage:
  deno run -A src/main.ts [options]

Options:
  -h, --help        Show help
  -v, --version     Show version\n`;
}

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

if (import.meta.main) {
  const code = main();
  // Ensure explicit exit code consistency
  Deno.exit(code);
}
