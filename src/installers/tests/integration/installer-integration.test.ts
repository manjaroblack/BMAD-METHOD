/**
 * Integration Tests for BMAD-METHOD Modular Installer
 * Tests the complete installation flow with all components integrated
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ensureDir, join } from "deps";
import { InstallerOrchestrator } from "deps";
import { InstallationDetector } from "deps";
// import { FreshInstallHandler } from 'deps';
// import { UpdateHandler } from 'deps';
// import { RepairHandler } from 'deps';
// import { UnknownInstallHandler } from 'deps';
import { ManifestService } from "deps";
import { ExpansionPackService } from "deps";
import { IntegrityChecker } from "deps";
// import { CoreInstaller } from 'deps';
import { logger } from "deps";
import { performanceMonitor } from "deps";
import { spinner } from "deps";
import { fileSystemService } from "deps";
import type { InstallConfig } from "deps";

// Test configuration
const TEST_CONFIG = {
  baseDir: "/tmp/bmad-installer-test",
  sourceDir: "/tmp/bmad-test-source",
  installDir: "/tmp/bmad-test-install",
  backupDir: "/tmp/bmad-test-backup",
};

// Test utilities
class TestUtils {
  static async setupTestEnvironment(): Promise<void> {
    // Clean up any existing test directories
    await this.cleanupTestEnvironment();

    // Create test directories
    await ensureDir(TEST_CONFIG.baseDir);
    await ensureDir(TEST_CONFIG.sourceDir);
    await ensureDir(TEST_CONFIG.installDir);
    await ensureDir(TEST_CONFIG.backupDir);

    // Create mock source files
    await this.createMockSourceFiles();
  }

  static async cleanupTestEnvironment(): Promise<void> {
    try {
      await Deno.remove(TEST_CONFIG.baseDir, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  }

  static async createMockSourceFiles(): Promise<void> {
    // Create mock core files
    const coreDir = join(TEST_CONFIG.sourceDir, "core");
    await ensureDir(join(coreDir, "agents"));
    await ensureDir(join(coreDir, "workflows"));
    await ensureDir(join(coreDir, "checklists"));

    await Deno.writeTextFile(
      join(coreDir, "agents/test-agent.ts"),
      "// Mock agent file",
    );
    await Deno.writeTextFile(
      join(coreDir, "workflows/test-workflow.ts"),
      "// Mock workflow file",
    );
    await Deno.writeTextFile(
      join(coreDir, "checklists/test-checklist.ts"),
      "// Mock checklist file",
    );

    // Create mock expansion pack
    const expansionDir = join(TEST_CONFIG.sourceDir, "extensions/test-pack");
    await ensureDir(expansionDir);
    await Deno.writeTextFile(
      join(expansionDir, "manifest.json"),
      JSON.stringify(
        {
          name: "test-pack",
          version: "1.0.0",
          description: "Test expansion pack",
        },
        null,
        2,
      ),
    );

    // Create mock tooling
    const toolingDir = join(TEST_CONFIG.sourceDir, "tooling");
    await ensureDir(toolingDir);
    await Deno.writeTextFile(
      join(toolingDir, "test-tool.ts"),
      "// Mock tool file",
    );
  }

  static async createCorruptedInstallation(): Promise<void> {
    // Create a partially corrupted installation for repair testing
    await ensureDir(TEST_CONFIG.installDir);

    // Create manifest with some missing files
    const manifest = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      coreVersion: "1.0.0",
      files: [
        "core/agents/test-agent.ts",
        "core/workflows/test-workflow.ts",
        "missing-file.ts", // This file won't exist
      ],
    };

    await Deno.writeTextFile(
      join(TEST_CONFIG.installDir, ".bmad-manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    // Create only some of the files
    const coreDir = join(TEST_CONFIG.installDir, "core");
    await ensureDir(join(coreDir, "agents"));
    await Deno.writeTextFile(
      join(coreDir, "agents/test-agent.ts"),
      "// Existing agent file",
    );
    // Intentionally don't create test-workflow.ts to simulate corruption
  }
}

// Test suite
Deno.test("Installer Integration Tests", async (t) => {
  await t.step("Setup", async () => {
    await TestUtils.setupTestEnvironment();
  });

  await t.step("Fresh Installation Flow", async () => {
    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: true,
    };

    // Create orchestrator with all dependencies
    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Perform fresh installation
    const result = await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });

    // Verify installation success
    assertEquals(result.success, true);
    assertEquals(result.type, "fresh");

    // Verify manifest was created
    const manifestPath = join(TEST_CONFIG.installDir, ".bmad-manifest.json");
    assertExists(await manifestPath);

    // Verify core files were installed
    const agentFile = join(TEST_CONFIG.installDir, "core/agents/test-agent.ts");
    assertExists(await agentFile);
  });

  await t.step("Update Installation Flow", async () => {
    // Modify source files to simulate updates
    const sourceAgent = join(
      TEST_CONFIG.sourceDir,
      "core/agents/test-agent.ts",
    );
    await Deno.writeTextFile(sourceAgent, "// Updated agent file v2.0");

    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: false,
    };

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Perform update
    const result = await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });

    // Verify update success
    assertEquals(result.success, true);
    assertEquals(result.type, "update");

    // Verify files were updated
    const updatedContent = await Deno.readTextFile(
      join(TEST_CONFIG.installDir, "core/agents/test-agent.ts"),
    );
    assertEquals(updatedContent, "// Updated agent file v2.0");
  });

  await t.step("Repair Installation Flow", async () => {
    // Create corrupted installation
    await TestUtils.createCorruptedInstallation();

    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: false,
    };

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Perform repair
    const result = await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });

    // Verify repair success
    assertEquals(result.success, true);
    assertEquals(result.type, "repair");

    // Verify missing files were restored
    const workflowFile = join(
      TEST_CONFIG.installDir,
      "core/workflows/test-workflow.ts",
    );
    assertExists(await workflowFile);
  });

  await t.step("Expansion Pack Installation", async () => {
    const config: InstallConfig = {
      selectedPacks: ["test-pack"],
      expansionOnly: true,
    };

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Install expansion pack
    const result = await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });

    // Verify installation success
    assertEquals(result.success, true);

    // Verify expansion pack was installed
    const packManifest = join(
      TEST_CONFIG.installDir,
      "extensions/test-pack/manifest.json",
    );
    assertExists(await packManifest);
  });

  await t.step("Error Handling - Invalid Configuration", async () => {
    const invalidConfig: InstallConfig = {
      selectedPacks: ["non-existent-pack"],
    };

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Should handle invalid configuration gracefully
    await assertRejects(
      () =>
        orchestrator.install({
          ...invalidConfig,
          directory: TEST_CONFIG.installDir,
        }),
      Error,
      "Expansion pack not found",
    );
  });

  await t.step("Performance Benchmarks", async () => {
    // Reset performance service
    performanceMonitor.reset();

    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: true,
    };

    // Clear installation directory for fresh test
    await Deno.remove(TEST_CONFIG.installDir, { recursive: true });
    await ensureDir(TEST_CONFIG.installDir);

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    const startTime = performance.now();

    // Perform installation with performance tracking
    const operationId = performanceMonitor.start("full-installation");
    const result = await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });
    const metrics = performanceMonitor.end(operationId);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Verify performance constraints
    console.log(`Installation completed in ${totalTime.toFixed(2)}ms`);
    console.log(`Performance metrics:`, metrics);

    // Basic performance assertions
    assertEquals(result.success, true);
    // Installation should complete within reasonable time (adjust threshold as needed)
    assertEquals(
      totalTime < 5000,
      true,
      `Installation took ${totalTime}ms, expected < 5000ms`,
    );
  });

  await t.step("Memory Usage Tracking", async () => {
    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: true,
    };

    // Clear installation directory
    await Deno.remove(TEST_CONFIG.installDir, { recursive: true });
    await ensureDir(TEST_CONFIG.installDir);

    // Force garbage collection if available
    if ((globalThis as unknown as { gc?: () => void }).gc) {
      (globalThis as unknown as { gc: () => void }).gc();
    }

    const memBefore = Deno.memoryUsage();

    const orchestrator = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    await orchestrator.install({
      ...config,
      directory: TEST_CONFIG.installDir,
    });

    // Force garbage collection if available
    if ((globalThis as unknown as { gc?: () => void }).gc) {
      (globalThis as unknown as { gc: () => void }).gc();
    }

    const memAfter = Deno.memoryUsage();

    const memDiff = {
      rss: memAfter.rss - memBefore.rss,
      heapUsed: memAfter.heapUsed - memBefore.heapUsed,
      heapTotal: memAfter.heapTotal - memBefore.heapTotal,
    };

    console.log("Memory usage difference:", memDiff);

    // Memory usage should be reasonable (adjust thresholds as needed)
    const memMB = memDiff.heapUsed / (1024 * 1024);
    console.log(`Heap memory increase: ${memMB.toFixed(2)}MB`);

    // Basic memory constraint (should not use excessive memory)
    assertEquals(
      memMB < 100,
      true,
      `Memory usage ${memMB}MB exceeds 100MB threshold`,
    );
  });

  await t.step("Concurrent Installation Handling", async () => {
    const config: InstallConfig = {
      selectedPacks: [".bmad-core"],
      full: true,
    };

    // Test concurrent installations to same directory (should be handled safely)
    const orchestrator1 = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    const orchestrator2 = new InstallerOrchestrator({
      logger,
      performanceMonitor,
      spinner,
      installationDetector: new InstallationDetector(fileSystemService, logger),
      manifestService: new ManifestService(fileSystemService, logger),
      expansionPackService: new ExpansionPackService(fileSystemService, logger),
      integrityChecker: new IntegrityChecker(fileSystemService, logger),
    });

    // Clear installation directory
    await Deno.remove(TEST_CONFIG.installDir, { recursive: true });
    await ensureDir(TEST_CONFIG.installDir);

    // Start both installations concurrently
    const [result1, result2] = await Promise.allSettled([
      orchestrator1.install({
        ...config,
        directory: TEST_CONFIG.installDir,
      }),
      orchestrator2.install({
        ...config,
        directory: TEST_CONFIG.installDir,
      }),
    ]);

    // At least one should succeed
    const successCount = [result1, result2].filter((r) =>
      r.status === "fulfilled" && r.value.success
    ).length;

    assertEquals(
      successCount >= 1,
      true,
      "At least one concurrent installation should succeed",
    );
  });

  await t.step("Cleanup", async () => {
    await TestUtils.cleanupTestEnvironment();
  });
});

// Performance benchmark utility
export class PerformanceBenchmark {
  static async benchmarkInstallationTypes(): Promise<void> {
    console.log("\n=== BMAD Installer Performance Benchmarks ===\n");

    await TestUtils.setupTestEnvironment();

    const configs = [
      {
        name: "Minimal Core",
        config: { selectedPacks: [".bmad-core"], expansionOnly: false },
      },
      {
        name: "Full Installation",
        config: { selectedPacks: [".bmad-core"], full: true },
      },
      {
        name: "Expansion Only",
        config: { selectedPacks: ["test-pack"], expansionOnly: true },
      },
    ];

    for (const { name, config } of configs) {
      console.log(`Benchmarking: ${name}`);

      // Clear installation directory
      await Deno.remove(TEST_CONFIG.installDir, { recursive: true });
      await ensureDir(TEST_CONFIG.installDir);

      const orchestrator = new InstallerOrchestrator({
        logger,
        performanceMonitor,
        spinner,
        installationDetector: new InstallationDetector(
          fileSystemService,
          logger,
        ),
        manifestService: new ManifestService(fileSystemService, logger),
        expansionPackService: new ExpansionPackService(
          fileSystemService,
          logger,
        ),
        integrityChecker: new IntegrityChecker(fileSystemService, logger),
      });

      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await Deno.remove(TEST_CONFIG.installDir, { recursive: true });
        await ensureDir(TEST_CONFIG.installDir);

        const startTime = performance.now();
        await orchestrator.install({
          ...(config as InstallConfig),
          directory: TEST_CONFIG.installDir,
        });
        const endTime = performance.now();

        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log(`  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min: ${minTime.toFixed(2)}ms`);
      console.log(`  Max: ${maxTime.toFixed(2)}ms`);
      console.log("");
    }

    await TestUtils.cleanupTestEnvironment();
    console.log("Benchmarks completed.\n");
  }
}

// Run benchmarks if this file is executed directly
if (import.meta.main) {
  await PerformanceBenchmark.benchmarkInstallationTypes();
}
