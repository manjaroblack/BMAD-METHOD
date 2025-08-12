// Basic sanity test to validate Deno test discovery and deps alias
import { assertEquals } from 'deps';

Deno.test('sanity: math works', () => {
  assertEquals(1 + 1, 2);
});
