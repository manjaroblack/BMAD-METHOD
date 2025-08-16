import { assertEquals, assertRejects } from 'deps';
import { ToolkitServiceImpl } from '../../src/services/toolkit_service.ts';

Deno.test('ToolkitService listTasks returns tasks from provided config', async () => {
  const svc = new ToolkitServiceImpl(undefined, () =>
    Promise.resolve({
      tasks: {
        build: 'deno check src',
        test: 'deno test',
      },
    }));

  const tasks = await svc.listTasks();
  const names = tasks.map((t) => t.name).sort();
  assertEquals(names, ['build', 'test']);
  const testTask = tasks.find((t) => t.name === 'test');
  assertEquals(testTask?.command, 'deno test');
});

Deno.test('ToolkitService runTask rejects on unknown task with helpful message', async () => {
  const svc = new ToolkitServiceImpl(undefined, () =>
    Promise.resolve({
      tasks: { lint: 'deno lint' },
    }));
  await assertRejects(
    () => svc.runTask('build'),
    Error,
    'Unknown task: build',
  );
});

Deno.test('ToolkitService runTask uses deno task with pass-through args and returns exit code', async () => {
  const calls: Array<{ cmd: string; args: string[] }> = [];
  const exec = (cmd: string, args: string[]) => {
    calls.push({ cmd, args });
    return Promise.resolve({ code: 123 });
  };
  const svc = new ToolkitServiceImpl(exec, () =>
    Promise.resolve({
      tasks: { foo: 'echo foo' },
    }));

  const { code } = await svc.runTask('foo', ['--', '--bar']);
  assertEquals(code, 123);
  assertEquals(calls.length, 1);
  assertEquals(calls[0]?.cmd, 'deno');
  assertEquals(calls[0]?.args, ['task', 'foo', '--', '--bar']);
});
