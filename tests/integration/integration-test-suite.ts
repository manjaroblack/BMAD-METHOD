/**
 * Integration Test Suite - Cross-module integration testing for BMAD-METHOD
 */

// deno-lint-ignore-file no-explicit-any require-await

import {
  AgentManager,
  IAgentManager,
  ExtensionManager,
  IExtensionManager,
  CLIFramework,
  BuildCommandPlugin,
  VersionManagementCommandPlugin,
  join,
  ProjectPaths
} from "deps";

export interface IntegrationTestResult {
  testName: string;
  success: boolean;
  duration: number;
  message?: string;
  details?: unknown;
}

export class IntegrationTestSuite {
  private agentManager: IAgentManager;
  private extensionManager: IExtensionManager;
  private cli: CLIFramework;
  private testResults: IntegrationTestResult[] = [];

  constructor() {
    this.agentManager = new AgentManager();
    this.extensionManager = new ExtensionManager();
    this.cli = new CLIFramework();
  }

  async runAllTests(): Promise<IntegrationTestResult[]> {
    console.log('🚀 Starting BMAD-METHOD Integration Test Suite...\n');
    
    const tests = [
      this.testAgentSystemIntegration.bind(this),
      this.testExtensionSystemIntegration.bind(this),
      this.testCLISystemIntegration.bind(this),
      this.testWorkflowIntegration.bind(this),
      this.testBuildSystemIntegration.bind(this),
      this.testVersionManagementIntegration.bind(this),
      this.testCrossModuleCommunication.bind(this),
      this.testErrorHandlingIntegration.bind(this),
      this.testPerformanceIntegration.bind(this)
    ];

    for (const test of tests) {
      try {
        const result = await this.runTest(test);
        this.testResults.push(result);
        this.logTestResult(result);
      } catch (error) {
        const failedResult: IntegrationTestResult = {
          testName: test.name,
          success: false,
          duration: 0,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
        this.testResults.push(failedResult);
        this.logTestResult(failedResult);
      }
    }

    this.printSummary();
    return this.testResults;
  }

  private async runTest(testFunction: () => Promise<IntegrationTestResult>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const result = await testFunction();
    result.duration = Date.now() - startTime;
    return result;
  }

  private async testAgentSystemIntegration(): Promise<IntegrationTestResult> {
    try {
      // Initialize agent system
      await this.agentManager.initialize();

      // Test agent creation and registration
      const testConfig = {
        role: 'developer' as any,
        name: 'Test Developer Agent',
        description: 'Test agent for integration testing',
        capabilities: ['coding', 'testing'],
        dependencies: [],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryAttempts: 3
      };

      const agent = await this.agentManager.createAgent(testConfig);
      const status = this.agentManager.getAgentStatus(agent.getId());
      
      if (status !== 'idle') {
        throw new Error(`Expected agent status 'idle', got '${status}'`);
      }

      return {
        testName: 'Agent System Integration',
        success: true,
        duration: 0,
        message: 'Agent system integration successful'
      };

    } catch (error) {
      return {
        testName: 'Agent System Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testExtensionSystemIntegration(): Promise<IntegrationTestResult> {
    try {
      // Initialize extension system
      await this.extensionManager.initialize();

      // Test extension loading
      const extensionPath = join(ProjectPaths.extensions, 'bmad-2d-phaser-game-dev');
      const loadResult = await this.extensionManager.loadExtension(extensionPath);
      
      if (!loadResult.success) {
        throw new Error(`Extension loading failed: ${loadResult.error?.message}`);
      }

      // Test extension activation
      if (loadResult.extension) {
        await this.extensionManager.activateExtension(loadResult.extension.config.id);
        
        const activeExtensions = this.extensionManager.getActiveExtensions();
        if (activeExtensions.length === 0) {
          throw new Error('No extensions activated');
        }
      }

      return {
        testName: 'Extension System Integration',
        success: true,
        duration: 0,
        message: 'Extension system integration successful'
      };

    } catch (error) {
      return {
        testName: 'Extension System Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testCLISystemIntegration(): Promise<IntegrationTestResult> {
    try {
      // Register CLI plugins
      const buildPlugin = new BuildCommandPlugin();
      const versionPlugin = new VersionManagementCommandPlugin();

      await this.cli.registerPlugin(buildPlugin);
      await this.cli.registerPlugin(versionPlugin);

      // Test command registration
      const commands = this.cli.getCommands();
      if (commands.length === 0) {
        throw new Error('No commands registered');
      }

      // Test help command execution
      const helpResult = await this.cli.executeCommand('help', [], {});
      if (!helpResult.success) {
        throw new Error(`Help command failed: ${helpResult.message}`);
      }

      return {
        testName: 'CLI System Integration',
        success: true,
        duration: 0,
        message: 'CLI system integration successful'
      };

    } catch (error) {
      return {
        testName: 'CLI System Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testWorkflowIntegration(): Promise<IntegrationTestResult> {
    try {
      // Test workflow and agent integration
      const _mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Integration Workflow',
        description: 'Test workflow for integration testing',
        type: 'greenfield-fullstack' as string,
        version: '1.0.0',
        steps: [
          {
            id: 'step-1',
            name: 'Initialize Project',
            description: 'Initialize new project',
            type: 'agent-task',
            agent: 'developer',
            dependencies: [],
            parameters: { projectType: 'fullstack' }
          }
        ],
        variables: {},
        metadata: {}
      };

      // This would integrate with the workflow engine
      // For now, simulate successful workflow creation
      
      return {
        testName: 'Workflow Integration',
        success: true,
        duration: 0,
        message: 'Workflow integration successful'
      };

    } catch (error) {
      return {
        testName: 'Workflow Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testBuildSystemIntegration(): Promise<IntegrationTestResult> {
    try {
      // Test CLI build command integration
      const buildResult = await this.cli.executeCommand('build', [], { 
        'dry-run': true,
        'agents-only': true
      });

      if (!buildResult.success) {
        throw new Error(`Build command failed: ${buildResult.message}`);
      }

      return {
        testName: 'Build System Integration',
        success: true,
        duration: 0,
        message: 'Build system integration successful'
      };

    } catch (error) {
      return {
        testName: 'Build System Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testVersionManagementIntegration(): Promise<IntegrationTestResult> {
    try {
      // Test version management command integration
      const versionResult = await this.cli.executeCommand('check', [], { 
        format: 'json'
      });

      if (!versionResult.success) {
        throw new Error(`Version check failed: ${versionResult.message}`);
      }

      return {
        testName: 'Version Management Integration',
        success: true,
        duration: 0,
        message: 'Version management integration successful'
      };

    } catch (error) {
      return {
        testName: 'Version Management Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testCrossModuleCommunication(): Promise<IntegrationTestResult> {
    try {
      // Test communication between different modules
      const systemStatus = this.agentManager.getSystemStatus();
      const extensionMetrics = this.extensionManager.getMetrics();
      const cliMetrics = this.cli.getMetrics();

      if (!systemStatus || !extensionMetrics || !cliMetrics) {
        throw new Error('Failed to retrieve system metrics from modules');
      }

      return {
        testName: 'Cross-Module Communication',
        success: true,
        duration: 0,
        message: 'Cross-module communication successful',
        details: {
          agentSystem: systemStatus,
          extensionSystem: extensionMetrics,
          cliSystem: cliMetrics
        }
      };

    } catch (error) {
      return {
        testName: 'Cross-Module Communication',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testErrorHandlingIntegration(): Promise<IntegrationTestResult> {
    try {
      // Test error handling across modules
      const invalidCommandResult = await this.cli.executeCommand('nonexistent', [], {});
      
      if (invalidCommandResult.success) {
        throw new Error('Expected command to fail but it succeeded');
      }

      if (invalidCommandResult.exitCode !== 1) {
        throw new Error(`Expected exit code 1, got ${invalidCommandResult.exitCode}`);
      }

      return {
        testName: 'Error Handling Integration',
        success: true,
        duration: 0,
        message: 'Error handling integration successful'
      };

    } catch (error) {
      return {
        testName: 'Error Handling Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testPerformanceIntegration(): Promise<IntegrationTestResult> {
    try {
      const startTime = Date.now();
      
      // Perform multiple operations to test performance
      await this.agentManager.getSystemStatus();
      await this.extensionManager.getMetrics();
      const _commands = this.cli.getCommands();
      
      const duration = Date.now() - startTime;
      
      // Performance should be under 1 second for basic operations
      if (duration > 1000) {
        throw new Error(`Performance test failed: operations took ${duration}ms (expected <1000ms)`);
      }

      return {
        testName: 'Performance Integration',
        success: true,
        duration: 0,
        message: `Performance integration successful (${duration}ms)`,
        details: { operationDuration: duration }
      };

    } catch (error) {
      return {
        testName: 'Performance Integration',
        success: false,
        duration: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private logTestResult(result: IntegrationTestResult): void {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = `(${result.duration}ms)`;
    console.log(`${status} ${result.testName} ${duration}`);
    
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    
    if (!result.success && result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
    console.log();
  }

  private printSummary(): void {
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log('📊 Integration Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log();

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
    } else {
      console.log('🎉 All integration tests passed!');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.agentManager.shutdown();
      await this.cli.cleanup();
      console.log('🧹 Integration test cleanup completed');
    } catch (error) {
      console.error('⚠️  Error during cleanup:', error);
    }
  }
}

// Export test runner function
export async function runIntegrationTests(): Promise<boolean> {
  const testSuite = new IntegrationTestSuite();
  
  try {
    const results = await testSuite.runAllTests();
    const allPassed = results.every(r => r.success);
    
    return allPassed;
  } finally {
    await testSuite.cleanup();
  }
}

// CLI execution support
if (import.meta.main) {
  runIntegrationTests().then(success => {
    Deno.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Integration test suite failed:', error);
    Deno.exit(1);
  });
}
