// Centralized dependencies for BMAD-METHOD
// JSR-first, exact version pins, re-export symbols and types only.
// See docs/typescript-rules.md for guidelines.

// Standard library (pin exact major version)
export {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@1.0.0';
export * as path from 'jsr:@std/path@1.0.0';
// YAML is not yet available on JSR in stable form; use pinned URL import
export { parse as parseYaml } from 'jsr:@std/yaml@0.224.0';
// CLI flags and logging
export { parse as parseFlags } from 'jsr:@std/flags@0.224.0';
export * as log from 'jsr:@std/log@0.224.14';

// Example third-party JSR dependency (uncomment and pin exactly when needed)
// export { z } from 'jsr:@std/unknown@1.0.0'; // replace with actual package

// Types-only re-exports pattern examples
// export type { SomeType } from 'jsr:@scope/pkg@1.2.3';

// TUI library (pinned URL import; no JSR package available)
// See https://deno.land/x/tui@2.1.4
export * as denoTui from 'https://deno.land/x/tui@2.1.4/mod.ts';
// TUI components (buttons, labels, etc.) centralized via deps
export * as denoTuiComponents from 'https://deno.land/x/tui@2.1.4/src/components/mod.ts';
// TUI styling helper (Crayon), pinned exact version
export { crayon } from 'https://deno.land/x/crayon@3.3.3/mod.ts';

// Preact Signals (via Deno npm: specifier, pinned exact version)
// Note: npm versions differ from esm.sh tags. Use a valid npm version.
// Pinned: 1.3.0
export {
  signal,
  computed,
  effect,
  batch,
} from 'npm:@preact/signals-core@1.3.0';
export type {
  Signal,
  ReadonlySignal,
} from 'npm:@preact/signals-core@1.3.0';
