#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

/**
 * Test script for all migrated TypeScript files
 * Tests compilation, imports, and basic functionality of each migrated file
 */

import { blue, bold, exists, green, join, red, yellow } from "deps";

interface TestResult {
  file: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

interface TestSuite {
  name: string;
  files: string[];
}

class MigratedFilesTester {
  private rootDir: string;
  private results: TestResult[] = [];
  private totalTests = 0;
  private passedTests = 0;

  constructor() {
    this.rootDir = Deno.cwd();
  }

  /**
   * All migrated TypeScript files organized by category
   */
  private getTestSuites(): TestSuite[] {
    return [
      {
        name: "Core Libraries",
        files: [
          "tooling/lib/error-handler.ts",
          "tooling/lib/performance-optimizer.ts",
          "tooling/lib/dependency-resolver.ts",
          "tooling/lib/yaml-utils.ts",
          "tooling/lib/node-version-manager.ts",
        ],
      },
      {
        name: "CLI and Build Tools",
        files: [
          "tooling/cli/cli.ts",
          "tooling/build-tools/web-builder.ts",
          "tooling/upgrade/v3-to-v5-upgrader.ts",
          "tooling/user-tools/flattener/main.ts",
        ],
      },
      {
        name: "Scripts",
        files: [
          "tooling/scripts/manage-dependencies.ts",
          "tooling/scripts/master-optimizer.ts",
          "tooling/scripts/optimize-build.ts",
          "tooling/scripts/semantic-release-sync-installer.ts",
          "tooling/scripts/validate-installation.ts",
          "tooling/scripts/yaml-format.ts",
        ],
      },
      {
        name: "Version Management",
        files: [
          "tooling/version-management/bump-all-versions.ts",
          "tooling/version-management/bump-expansion-version.ts",
          "tooling/version-management/sync-installer-version.ts",
          "tooling/version-management/update-expansion-version.ts",
          "tooling/version-management/version-bump.ts",
        ],
      },
      {
        name: "Installer System",
        files: [
          "tooling/installers/bin/bmad.ts",
          "tooling/installers/lib/installer.ts",
          "tooling/installers/lib/config-loader.ts",
          "tooling/installers/lib/file-manager.ts",
          "tooling/installers/lib/ide-base-setup.ts",
          "tooling/installers/lib/ide-setup.ts",
          "tooling/installers/lib/incremental-updater.ts",
          "tooling/installers/lib/installer-validator.ts",
          "tooling/installers/lib/memory-profiler.ts",
          "tooling/installers/lib/module-manager.ts",
          "tooling/installers/lib/resource-locator.ts",
        ],
      },
    ];
  }

  /**
   * Test a single TypeScript file
   */
  private async testFile(filePath: string): Promise<TestResult> {
    const startTime = performance.now();
    const result: TestResult = {
      file: filePath,
      passed: false,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      const fullPath = join(this.rootDir, filePath);

      // Check if file exists
      if (!(await exists(fullPath))) {
        result.errors.push("File does not exist");
        result.duration = performance.now() - startTime;
        return result;
      }

      // Test 1: TypeScript compilation check
      await this.testCompilation(fullPath, result);

      // Test 2: Import validation
      await this.testImports(fullPath, result);

      // Test 3: Basic syntax and structure
      await this.testSyntax(fullPath, result);

      // Test 4: Deno-specific checks
      await this.testDenoCompatibility(fullPath, result);

      // Mark as passed if no errors
      result.passed = result.errors.length === 0;
    } catch (error) {
      result.errors.push(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    result.duration = performance.now() - startTime;
    return result;
  }

  /**
   * Test TypeScript compilation
   */
  private async testCompilation(filePath: string, result: TestResult): Promise<void> {
    try {
      const command = new Deno.Command("deno", {
        args: ["check", filePath],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await command.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        result.errors.push(`Compilation failed: ${errorText}`);
      }
    } catch (error) {
      result.errors.push(
        `Compilation test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Test import statements
   */
  private async testImports(filePath: string, result: TestResult): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);

      // Check for Node.js imports that should be migrated
      const nodeImports = [
        /import.*from ['"]fs['"]/,
        /import.*from ['"]path['"]/,
        /import.*from ['"]child_process['"]/,
        /import.*from ['"]os['"]/,
        /import.*from ['"]util['"]/,
        /require\(/,
      ];

      for (const pattern of nodeImports) {
        if (pattern.test(content)) {
          result.warnings.push(`Found potential Node.js import: ${pattern}`);
        }
      }

      // Check for proper Deno imports
      const denoImports = [
        /@std\//,
        /@cliffy\//,
        /from "https:\/\/deno\.land/,
      ];

      let hasDenoImports = false;
      for (const pattern of denoImports) {
        if (pattern.test(content)) {
          hasDenoImports = true;
          break;
        }
      }

      if (!hasDenoImports && content.includes("import")) {
        result.warnings.push("No Deno-style imports found, but imports are present");
      }
    } catch (error) {
      result.errors.push(
        `Import test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Test basic syntax and structure
   */
  private async testSyntax(filePath: string, result: TestResult): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);

      // Check for proper TypeScript syntax
      if (!content.includes("export") && !content.includes("import.meta.main")) {
        result.warnings.push("File may not export anything or be a main module");
      }

      // Check for proper shebang for executable files
      if (filePath.includes("/bin/") || filePath.includes("/cli/")) {
        if (!content.startsWith("#!/usr/bin/env -S deno run")) {
          result.warnings.push("Executable file missing proper Deno shebang");
        }
      }

      // Check for TypeScript types
      if (!content.includes(":") && content.length > 100) {
        result.warnings.push("File may be missing TypeScript type annotations");
      }
    } catch (error) {
      result.errors.push(
        `Syntax test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Test Deno-specific compatibility
   */
  private async testDenoCompatibility(filePath: string, result: TestResult): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);

      // Check for Node.js-specific APIs that need migration
      const nodeApis = [
        /process\./,
        /Buffer\./,
        /__dirname/,
        /__filename/,
        /module\.exports/,
        /exports\./,
      ];

      for (const pattern of nodeApis) {
        if (pattern.test(content)) {
          result.errors.push(`Found Node.js API that needs migration: ${pattern}`);
        }
      }

      // Check for proper Deno API usage
      const denoApis = [
        /Deno\./,
        /import\.meta/,
      ];

      let hasDenoApis = false;
      for (const pattern of denoApis) {
        if (pattern.test(content)) {
          hasDenoApis = true;
          break;
        }
      }

      if (!hasDenoApis && content.length > 500) {
        result.warnings.push("Large file with no Deno APIs detected");
      }
    } catch (error) {
      result.errors.push(
        `Deno compatibility test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log(bold(blue("🧪 Testing All Migrated TypeScript Files")));
    console.log("=".repeat(50));

    const testSuites = this.getTestSuites();

    for (const suite of testSuites) {
      console.log(`\n${bold(yellow(`📁 ${suite.name}`))}`);
      console.log("-".repeat(30));

      for (const file of suite.files) {
        this.totalTests++;
        await Deno.stdout.write(new TextEncoder().encode(`  Testing ${file}... `));

        const result = await this.testFile(file);
        this.results.push(result);

        if (result.passed) {
          this.passedTests++;
          console.log(green(`✅ PASS (${result.duration.toFixed(1)}ms)`));
        } else {
          console.log(red(`❌ FAIL (${result.duration.toFixed(1)}ms)`));
          for (const error of result.errors) {
            console.log(red(`    ❌ ${error}`));
          }
        }

        if (result.warnings.length > 0) {
          for (const warning of result.warnings) {
            console.log(yellow(`    ⚠️  ${warning}`));
          }
        }
      }
    }

    this.printSummary();
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log("\n" + "=".repeat(50));
    console.log(bold(blue("📊 Test Summary")));
    console.log("=".repeat(50));

    const failedTests = this.totalTests - this.passedTests;
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);

    console.log(`Total Files Tested: ${this.totalTests}`);
    console.log(`${green(`✅ Passed: ${this.passedTests}`)}`);
    console.log(`${red(`❌ Failed: ${failedTests}`)}`);
    console.log(`Success Rate: ${successRate}%`);

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Duration: ${totalDuration.toFixed(1)}ms`);

    if (failedTests > 0) {
      console.log(`\n${red("❌ Failed Files:")}`);
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ${red("❌")} ${r.file}`);
          r.errors.forEach((error) => console.log(`    - ${error}`));
        });
    }

    const warningCount = this.results.reduce((sum, r) => sum + r.warnings.length, 0);
    if (warningCount > 0) {
      console.log(`\n${yellow(`⚠️  Total Warnings: ${warningCount}`)}`);
    }

    console.log(
      `\n${
        bold(
          successRate === "100.0"
            ? green("🎉 All tests passed!")
            : yellow("⚠️  Some tests failed. Please review and fix issues."),
        )
      }`,
    );
  }

  /**
   * Generate detailed report
   */
  async generateReport(): Promise<void> {
    const reportPath = join(this.rootDir, "migration-test-report.md");

    let report = "# Migration Test Report\n\n";
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Files**: ${this.totalTests}\n`;
    report += `- **Passed**: ${this.passedTests}\n`;
    report += `- **Failed**: ${this.totalTests - this.passedTests}\n`;
    report += `- **Success Rate**: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%\n\n`;

    report += "## Detailed Results\n\n";

    for (const result of this.results) {
      report += `### ${result.file}\n\n`;
      report += `- **Status**: ${result.passed ? "✅ PASS" : "❌ FAIL"}\n`;
      report += `- **Duration**: ${result.duration.toFixed(1)}ms\n`;

      if (result.errors.length > 0) {
        report += "- **Errors**:\n";
        result.errors.forEach((error) => report += `  - ${error}\n`);
      }

      if (result.warnings.length > 0) {
        report += "- **Warnings**:\n";
        result.warnings.forEach((warning) => report += `  - ${warning}\n`);
      }

      report += "\n";
    }

    await Deno.writeTextFile(reportPath, report);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
if (import.meta.main) {
  const tester = new MigratedFilesTester();

  try {
    await tester.runAllTests();
    await tester.generateReport();
  } catch (error) {
    console.error(
      red(`❌ Test runner failed: ${error instanceof Error ? error.message : String(error)}`),
    );
    Deno.exit(1);
  }
}
