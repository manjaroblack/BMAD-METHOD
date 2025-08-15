// Deno 2 compatibility shim for libraries expecting Deno.writeSync(rid, data)
// This installs a minimal adapter that routes writes to stdout/stderr.
// Safe no-op if Deno.writeSync already exists.

(function installWriteSyncShim(): void {
  const d = (globalThis as { Deno?: typeof Deno }).Deno;
  if (!d) return;
  if (typeof (d as unknown as { writeSync?: unknown }).writeSync === 'function') return; // already present

  type SyncWriter = { writeSync: (data: Uint8Array) => number; rid?: number };
  const stdout = d.stdout as unknown as SyncWriter | undefined;
  const stderr = d.stderr as unknown as SyncWriter | undefined;

  if (!stdout?.writeSync || !stderr?.writeSync) {
    // Environment does not provide writeSync targets; leave unmodified.
    return;
  }

  const stdoutRid = typeof stdout.rid === 'number' ? stdout.rid : -1;
  const stderrRid = typeof stderr.rid === 'number' ? stderr.rid : -2;

  (d as unknown as { writeSync: (rid: number, data: Uint8Array) => number }).writeSync = (
    rid: number,
    data: Uint8Array,
  ): number => {
    if (rid === stdoutRid) return stdout.writeSync(data);
    if (rid === stderrRid) return stderr.writeSync(data);
    // Best-effort: try stdout for unknown RIDs commonly used by libraries
    try {
      return stdout.writeSync(data);
    } catch {
      // As a last resort, try stderr
      return stderr.writeSync(data);
    }
  };
})();

export {};
