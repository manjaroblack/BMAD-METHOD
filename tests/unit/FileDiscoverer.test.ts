import { describe, it, beforeEach, afterEach } from '../../deps.ts';
import { stub, type Stub } from '../../deps.ts';
import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.6';

import { FileDiscoverer } from '../../src/components/flattener/services/FileDiscoverer.ts';
import { ServiceError } from '../../src/core/errors/ServiceError.ts';

describe('FileDiscoverer', () => {
  let fileDiscoverer: FileDiscoverer;
  let walkStub: Stub;

  beforeEach(() => {
    fileDiscoverer = new FileDiscoverer();
  });

  afterEach(() => {
    if (walkStub) {
      walkStub.restore();
    }
  });

  it('should discover files in a directory', async () => {
    // This is a basic test structure
    // In a real implementation, we would mock the file system
    const files = await fileDiscoverer.discoverFiles('./test');
    // Add assertions based on expected behavior
  });

  it('should filter files based on patterns', async () => {
    const files = ['file1.ts', 'file2.js', 'file3.txt'];
    const filtered = fileDiscoverer.filterFiles(files, { include: ['*.ts'] });
    // Add assertions
  });

  it('should throw ServiceError on failure', async () => {
    // Test error handling
  });
});
