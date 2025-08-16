import { assertEquals, assertStringIncludes } from 'deps';
import { mainAsync } from '../../src/main.ts';

Deno.test('CLI --toolkit runs task with pass-through args and returns subprocess code', async () => {
  const out: string[] = [];
  const calls: Array<{ cmd: string; args: string[] }> = [];
  const code = await mainAsync(
    {
      print: (msg) => out.push(String(msg)),
      toolkitExec: (cmd, args) => {
        calls.push({ cmd, args });
        return Promise.resolve({ code: 7 });
      },
      configProvider: () => Promise.resolve({ tasks: { lint: 'deno lint' } }),
    },
    ['--toolkit', 'lint', '--', '--fix'],
  );

  assertEquals(code, 7);
  assertStringIncludes(out.join('\n'), 'exited with code 7');
  assertEquals(calls.length, 1);
  assertEquals(calls[0]?.cmd, 'deno');
  assertEquals(calls[0]?.args, ['task', 'lint', '--', '--fix']);
});

Deno.test('CLI --toolkit unknown task exits 1 and prints message', async () => {
  const out: string[] = [];
  const code = await mainAsync(
    {
      print: (msg) => out.push(String(msg)),
      toolkitExec: () => Promise.resolve({ code: 0 }),
      configProvider: () => Promise.resolve({ tasks: { test: 'deno test' } }),
    },
    ['--toolkit', 'lint'],
  );

  assertEquals(code, 1);
  const stdout = out.join('\n');
  assertStringIncludes(stdout, 'Unknown task: lint');
});

Deno.test('CLI --toolkit without pass-through does not add --', async () => {
  const calls: Array<{ cmd: string; args: string[] }> = [];
  const code = await mainAsync(
    {
      print: () => {},
      toolkitExec: (cmd, args) => {
        calls.push({ cmd, args });
        return Promise.resolve({ code: 0 });
      },
      configProvider: () => Promise.resolve({ tasks: { build: 'deno check src' } }),
    },
    ['--toolkit', 'build'],
  );

  assertEquals(code, 0);
  assertEquals(calls.length, 1);
  assertEquals(calls[0]?.args, ['task', 'build']);
});
