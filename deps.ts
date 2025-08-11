// Centralized dependencies for BMAD-METHOD
// JSR-first, exact version pins, re-export symbols and types only.
// See docs/typescript-rules.md for guidelines.

// Standard library (pin exact major version)
export { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1.0.0';
export * as path from 'jsr:@std/path@1.0.0';
// YAML is not yet available on JSR in stable form; use pinned URL import
export { parse as parseYaml } from 'https://deno.land/std@0.224.0/yaml/mod.ts';

// Example third-party JSR dependency (uncomment and pin exactly when needed)
// export { z } from 'jsr:@std/unknown@1.0.0'; // replace with actual package

// Types-only re-exports pattern examples
// export type { SomeType } from 'jsr:@scope/pkg@1.2.3';
