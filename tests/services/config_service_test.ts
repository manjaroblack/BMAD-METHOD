import { assertEquals, assertRejects } from 'deps';
import { path } from 'deps';
import { ConfigServiceImpl } from '../../src/services/config_service.ts';

Deno.test('ConfigService.getCoreConfigPath returns expected absolute path', () => {
  const svc = new ConfigServiceImpl(
    undefined,
    undefined,
    'darwin',
    Deno.cwd(),
  );
  const expected = path.join(Deno.cwd(), 'bmad-core', 'core-config.yaml');
  assertEquals(svc.getCoreConfigPath(), expected);
});

Deno.test('ConfigService.openCoreConfig success path resolves with code 0', async () => {
  const FILE_EXISTS = true;
  const svc = new ConfigServiceImpl(
    (_target) => Promise.resolve({ code: 0 }),
    (_p) => Promise.resolve(FILE_EXISTS),
    'darwin',
    Deno.cwd(),
  );
  const { code } = await svc.openCoreConfig();
  assertEquals(code, 0);
});

Deno.test('ConfigService.openCoreConfig missing file rejects with actionable message', async () => {
  const FILE_MISSING = false;
  const svc = new ConfigServiceImpl(
    (_target) => Promise.resolve({ code: 0 }),
    (_p) => Promise.resolve(FILE_MISSING),
    'darwin',
    Deno.cwd(),
  );
  await assertRejects(
    () => svc.openCoreConfig(),
    Error,
    'core-config.yaml not found',
  );
});

Deno.test('ConfigService.openCoreConfig opener non-zero exit yields failure message', async () => {
  const FILE_EXISTS = true;
  const svc = new ConfigServiceImpl(
    (_target) => Promise.resolve({ code: 5 }),
    (_p) => Promise.resolve(FILE_EXISTS),
    'linux',
    Deno.cwd(),
  );
  await assertRejects(
    () => svc.openCoreConfig(),
    Error,
    'Failed to open core-config.yaml (code 5)',
  );
});

Deno.test('ConfigService.openCoreConfig read permission denied suggests flags', async () => {
  const svc = new ConfigServiceImpl(
    (_target) => Promise.resolve({ code: 0 }),
    (_p) => Promise.reject(new Deno.errors.PermissionDenied('read denied')),
    'linux',
    Deno.cwd(),
  );
  await assertRejects(
    () => svc.openCoreConfig(),
    Error,
    'Include --allow-read',
  );
});

Deno.test('ConfigService.openCoreConfig run permission denied suggests flags', async () => {
  const FILE_EXISTS = true;
  const svc = new ConfigServiceImpl(
    (_target) => Promise.reject(new Deno.errors.PermissionDenied('run denied')),
    (_p) => Promise.resolve(FILE_EXISTS),
    'windows',
    Deno.cwd(),
  );
  await assertRejects(
    () => svc.openCoreConfig(),
    Error,
    'Include --allow-run',
  );
});
