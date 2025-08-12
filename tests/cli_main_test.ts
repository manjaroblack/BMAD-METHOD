import { assertEquals, assertStringIncludes } from 'deps';
import { APP_NAME, getUsage, main, VERSION } from '../src/main.ts';

Deno.test('CLI --help prints usage and exits 0', () => {
  const out: string[] = [];
  const code = main({ print: (msg) => out.push(String(msg)) }, ['--help']);
  const stdout = out.join('\n');

  assertEquals(code, 0);
  assertStringIncludes(stdout, 'Usage:');
  assertStringIncludes(stdout, APP_NAME);
  const header = getUsage().trim().split('\n')[0] ?? 'Usage:'; // safe fallback
  assertStringIncludes(stdout, header); // header line
});

Deno.test('CLI --version prints version and exits 0', () => {
  const out: string[] = [];
  const code = main({ print: (msg) => out.push(String(msg)) }, ['--version']);
  const stdout = out.join('\n');

  assertEquals(code, 0);
  assertStringIncludes(stdout, VERSION);
  assertStringIncludes(stdout, APP_NAME);
});

Deno.test('CLI default (no args) shows help and exits 0', () => {
  const out: string[] = [];
  const code = main({ print: (msg) => out.push(String(msg)) }, []);
  const stdout = out.join('\n');

  assertEquals(code, 0);
  assertStringIncludes(stdout, 'Usage:');
});

Deno.test('CLI -h prints usage and exits 0', () => {
  const out: string[] = [];
  const code = main({ print: (msg) => out.push(String(msg)) }, ['-h']);
  const stdout = out.join('\n');

  assertEquals(code, 0);
  assertStringIncludes(stdout, 'Usage:');
  const header = getUsage().trim().split('\n')[0] ?? 'Usage:';
  assertStringIncludes(stdout, header);
});

Deno.test('CLI -v prints version and exits 0', () => {
  const out: string[] = [];
  const code = main({ print: (msg) => out.push(String(msg)) }, ['-v']);
  const stdout = out.join('\n');

  assertEquals(code, 0);
  assertStringIncludes(stdout, VERSION);
  assertStringIncludes(stdout, APP_NAME);
});
