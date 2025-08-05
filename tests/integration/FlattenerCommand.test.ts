import { describe, it, beforeEach, afterEach } from '../../deps.ts';
import { stub, type Stub } from '../../deps.ts';
import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.6';

import { FlattenerCommand } from '../../src/components/flattener/flattener.command.ts';
import { ServiceError } from '../../src/core/errors/ServiceError.ts';

describe('FlattenerCommand', () => {
  let flattenerCommand: FlattenerCommand;
  let fileDiscovererStub: any;

  beforeEach(() => {
    // Create a mock file discoverer
    fileDiscovererStub = {
      discoverFiles: stub(),
      filterFiles: stub(),
    };
    
    flattenerCommand = new FlattenerCommand(fileDiscovererStub);
  });

  afterEach(() => {
    // Restore stubs
  });

  it('should execute flatten command successfully', async () => {
    // Mock file discoverer to return test files
    fileDiscovererStub.discoverFiles.returns(Promise.resolve(['file1.ts', 'file2.ts']));
    fileDiscovererStub.filterFiles.returns(['file1.ts', 'file2.ts']);
    
    // Execute command
    await flattenerCommand.execute({ directory: './test' });
    
    // Assert expected behavior
  });

  it('should handle errors during execution', async () => {
    // Mock file discoverer to throw an error
    fileDiscovererStub.discoverFiles.throws(new ServiceError('Test error', 'TEST_ERROR'));
    
    // Assert that error is properly handled
    await assertThrows(async () => {
      await flattenerCommand.execute({ directory: './test' });
    }, ServiceError);
  });
});
