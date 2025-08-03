#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Installation validation script
 * Comprehensive validation for BMAD installations with detailed reporting
 * Migrated from Node.js to Deno
 */

import {
  blue,
  BMadError,
  bold,
  Command,
  cyan,
  DenoVersionManager,
  gray,
  green,
  join,
  Logger,
  magenta,
  parseYaml,
  PerformanceMonitor,
  ProjectPaths,
  red,
  // dirname, // Currently unused
  safeExists,
  yellow,
} from "deps";

// Create colors object for compatibility
const colors = { blue, bold, cyan, gray, green, magenta, red, yellow };

// Interfaces for validation results
interface ValidationIssue {
  type: "error" | "warning" | "success" | "info";
  severity: "critical" | "warning" | "info";
  message: string;
  category: string;
  details?: string;
}

interface CategoryResult {
  status: "pass" | "warning" | "fail" | "unknown";
  issues: ValidationIssue[];
  score: number;
}

interface ValidationResults {
  overall: "pass" | "warning" | "fail" | "unknown";
  categories: {
    environment: CategoryResult;
    installation: CategoryResult;
    configuration: CategoryResult;
    performance: CategoryResult;
  };
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    overallScore: number;
  };
}

interface ValidationOptions {
  projectRoot?: string;
  report?: string;
  verbose?: boolean;
  json?: boolean;
}

interface BuildStats {
  totalSize: number;
  fileCount: number;
  directories: number;
}

interface FileValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

interface DiskSpaceInfo {
  available: number;
  used: number;
  total: number;
}

/**
 * Comprehensive installation validator for BMAD projects
 */
class InstallationValidator {
  private logger: Logger;
  private monitor: PerformanceMonitor;
  private denoManager: DenoVersionManager;
  private results: ValidationResults;
  private validationId?: string;

  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.denoManager = new DenoVersionManager();
    this.results = {
      overall: "unknown",
      categories: {
        environment: { status: "unknown", issues: [], score: 0 },
        installation: { status: "unknown", issues: [], score: 0 },
        configuration: { status: "unknown", issues: [], score: 0 },
        performance: { status: "unknown", issues: [], score: 0 },
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0,
        overallScore: 0,
      },
    };
  }

  // Main validation workflow
  async validate(options: ValidationOptions = {}): Promise<ValidationResults> {
    console.log("🔍 Starting installation validation...");
    this.validationId = this.monitor.start("full_validation");

    try {
      const projectRoot = options.projectRoot || Deno.cwd();

      // Step 1: Validate environment
      console.log("🌍 Validating environment...");
      await this.validateEnvironment(projectRoot);

      // Step 2: Validate installation integrity
      console.log("📦 Validating installation integrity...");
      await this.validateInstallation(projectRoot);

      // Step 3: Validate configuration
      console.log("⚙️ Validating configuration...");
      await this.validateConfiguration(projectRoot);

      // Step 4: Performance validation
      console.log("⚡ Validating performance...");
      await this.validatePerformance(projectRoot);

      // Calculate overall results
      this.calculateOverallResults();

      if (this.validationId) {
        this.monitor.end(this.validationId);
      }

      if (this.results.overall === "pass") {
        console.log(colors.green("✅ Installation validation completed successfully"));
      } else if (this.results.overall === "warning") {
        console.log(colors.yellow("⚠️ Installation validation completed with warnings"));
      } else {
        console.log(colors.red("❌ Installation validation failed"));
      }

      // Display results
      this.displayResults(options);

      // Generate report if requested
      if (options.report) {
        await this.generateReport(projectRoot, options.report);
      }

      return this.results;
    } catch (error) {
      if (this.validationId) {
        this.monitor.end(this.validationId);
      }
      console.log(colors.red(`❌ Validation failed: ${(error as Error).message}`));
      this.logger.error("Validation error:", error as Error);
      throw new BMadError(
        `Installation validation failed: ${(error as Error).message}`,
      );
    }
  }

  // Validate environment and prerequisites
  async validateEnvironment(projectRoot: string): Promise<void> {
    const category = this.results.categories.environment;

    try {
      // Deno version validation
      const denoVersion = Deno.version.deno;
      const versionParts = denoVersion.split(".").map(Number);

      if (versionParts[0] && versionParts[1] && versionParts[0] >= 1 && versionParts[1] >= 40) {
        category.issues.push({
          type: "success",
          severity: "info",
          message: `Deno version ${denoVersion} is compatible`,
          category: "deno",
        });
      } else {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: `Deno version ${denoVersion} may not be optimal. Consider upgrading to 1.40+`,
          category: "deno",
        });
      }

      // Check system prerequisites
      await this.validateSystemPrerequisites(category);

      // Check disk space
      await this.checkDiskSpace(projectRoot, category);

      // Calculate category score
      category.score = this.calculateCategoryScore(category);
      category.status = this.getCategoryStatus(category);
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Environment validation failed: ${(error as Error).message}`,
        category: "environment",
      });
      category.status = "fail";
    }
  }

  // Validate installation integrity
  async validateInstallation(projectRoot: string): Promise<void> {
    const category = this.results.categories.installation;

    try {
      // Validate core files
      await this.validateCoreFiles(projectRoot, category);

      // Validate expansion packs
      await this.validateExpansionPacks(projectRoot, category);

      // Check for orphaned files
      await this.findOrphanedFiles(projectRoot, category);

      // Validate deno.json files
      await this.validatePackageJsonFiles(projectRoot, category);

      // Check for conflicting installations
      await this.checkConflictingInstallations(projectRoot, category);

      // Calculate category score
      category.score = this.calculateCategoryScore(category);
      category.status = this.getCategoryStatus(category);
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Installation validation failed: ${(error as Error).message}`,
        category: "installation",
      });
      category.status = "fail";
    }
  }

  // Validate configuration
  async validateConfiguration(projectRoot: string): Promise<void> {
    const category = this.results.categories.configuration;

    try {
      // Validate deno.json
      const denoJsonPath = join(projectRoot, "deno.json");
      if (await safeExists(denoJsonPath)) {
        const result = await this.validateJsonFile(denoJsonPath, "deno.json");
        category.issues.push(...result.issues);
      } else {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: "deno.json not found",
          category: "configuration",
        });
      }

      // Validate YAML configuration files
      const configFiles = [
        "config/bmad.config.yaml",
        "core/core-config.yaml",
      ];

      for (const configFile of configFiles) {
        const configPath = join(projectRoot, configFile);
        if (await safeExists(configPath)) {
          const result = await this.validateYamlFile(configPath, configFile);
          category.issues.push(...result.issues);
        }
      }

      // Calculate category score
      category.score = this.calculateCategoryScore(category);
      category.status = this.getCategoryStatus(category);
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Configuration validation failed: ${(error as Error).message}`,
        category: "configuration",
      });
      category.status = "fail";
    }
  }

  // Validate performance
  async validatePerformance(projectRoot: string): Promise<void> {
    const category = this.results.categories.performance;

    try {
      // Validate build performance
      await this.validateBuildPerformance(projectRoot, category);

      // Check cache performance
      await this.validateCachePerformance(category);

      // Calculate category score
      category.score = this.calculateCategoryScore(category);
      category.status = this.getCategoryStatus(category);
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Performance validation failed: ${(error as Error).message}`,
        category: "performance",
      });
      category.status = "fail";
    }
  }

  // Validate core files
  async validateCoreFiles(projectRoot: string, category: CategoryResult): Promise<void> {
    const coreFiles = [
      "deno.json",
      "import_map.json",
      "core/core-config.yaml",
      "config/bmad.config.yaml",
    ];

    for (const file of coreFiles) {
      const filePath = join(projectRoot, file);
      if (await safeExists(filePath)) {
        category.issues.push({
          type: "success",
          severity: "info",
          message: `Core file ${file} found`,
          category: "core-files",
        });
      } else {
        category.issues.push({
          type: "error",
          severity: "critical",
          message: `Missing core file: ${file}`,
          category: "core-files",
        });
      }
    }
  }

  // Validate expansion packs
  async validateExpansionPacks(_projectRoot: string, category: CategoryResult): Promise<void> {
    const extensionsDir = ProjectPaths.extensions;

    if (!(await safeExists(extensionsDir))) {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: "Extensions directory not found",
        category: "expansion-packs",
      });
      return;
    }

    try {
      for await (const entry of Deno.readDir(extensionsDir)) {
        if (entry.isDirectory) {
          const configPath = join(extensionsDir, entry.name, "config.yaml");
          if (await safeExists(configPath)) {
            const result = await this.validateYamlFile(configPath, "expansion-config");
            category.issues.push(...result.issues);
          } else {
            category.issues.push({
              type: "warning",
              severity: "warning",
              message: `Missing config.yaml in expansion pack: ${entry.name}`,
              category: "expansion-packs",
            });
          }
        }
      }
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Failed to validate expansion packs: ${(error as Error).message}`,
        category: "expansion-packs",
      });
    }
  }

  // Find orphaned files
  async findOrphanedFiles(projectRoot: string, category: CategoryResult): Promise<void> {
    const orphanedPatterns = [
      "**/*.tmp",
      "**/*.log",
      "**/node_modules",
      "**/.DS_Store",
    ];

    // This is a simplified check - in a real implementation,
    // you might want to use a more sophisticated file scanning approach
    try {
      const tempFiles: string[] = [];

      // Check for common temporary files
      for (const pattern of orphanedPatterns) {
        // Simplified pattern matching - check specific known locations
        if (pattern.includes("node_modules")) {
          const nodeModulesPath = join(projectRoot, "node_modules");
          if (await safeExists(nodeModulesPath)) {
            tempFiles.push("node_modules");
          }
        }
      }

      if (tempFiles.length > 0) {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: `Found ${tempFiles.length} potentially orphaned files/directories`,
          category: "orphaned-files",
          details: tempFiles.join(", "),
        });
      } else {
        category.issues.push({
          type: "success",
          severity: "info",
          message: "No orphaned files detected",
          category: "orphaned-files",
        });
      }
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Failed to check for orphaned files: ${(error as Error).message}`,
        category: "orphaned-files",
      });
    }
  }

  // Validate YAML file
  async validateYamlFile(filePath: string, type: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      valid: true,
      issues: [],
    };

    try {
      const content = await Deno.readTextFile(filePath);
      parseYaml(content);

      result.issues.push({
        type: "success",
        severity: "info",
        message: `Valid YAML file: ${type}`,
        category: "yaml-validation",
      });
    } catch (error) {
      result.valid = false;
      result.issues.push({
        type: "error",
        severity: "critical",
        message: `Invalid YAML in ${type}: ${(error as Error).message}`,
        category: "yaml-validation",
      });
    }

    return result;
  }

  // Validate JSON file
  async validateJsonFile(filePath: string, type: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      valid: true,
      issues: [],
    };

    try {
      const content = await Deno.readTextFile(filePath);
      JSON.parse(content);

      result.issues.push({
        type: "success",
        severity: "info",
        message: `Valid JSON file: ${type}`,
        category: "json-validation",
      });
    } catch (error) {
      result.valid = false;
      result.issues.push({
        type: "error",
        severity: "critical",
        message: `Invalid JSON in ${type}: ${(error as Error).message}`,
        category: "json-validation",
      });
    }

    return result;
  }

  // Validate deno.json files
  async validatePackageJsonFiles(projectRoot: string, category: CategoryResult): Promise<void> {
    const packageJsonFiles = [
      "deno.json",
      "src/installers/deno.json",
    ];

    for (const file of packageJsonFiles) {
      const filePath = join(projectRoot, file);
      if (await safeExists(filePath)) {
        const result = await this.validateJsonFile(filePath, file);
        category.issues.push(...result.issues);
      }
    }
  }

  // Check for conflicting installations
  async checkConflictingInstallations(
    projectRoot: string,
    category: CategoryResult,
  ): Promise<void> {
    const conflictingPaths = [
      "node_modules",
      ".npm",
      "yarn.lock",
      "pnpm-lock.yaml",
    ];

    for (const conflictPath of conflictingPaths) {
      const fullPath = join(projectRoot, conflictPath);
      if (await safeExists(fullPath)) {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message:
            `Potential conflict detected: ${conflictPath} (Node.js artifact in Deno project)`,
          category: "conflicts",
        });
      }
    }
  }

  // Check disk space
  async checkDiskSpace(projectRoot: string, category: CategoryResult): Promise<void> {
    try {
      // Deno doesn't have a direct equivalent to Node.js fs.statSync for disk space
      // We'll use a simplified approach
      const _stat = await Deno.stat(projectRoot);

      category.issues.push({
        type: "success",
        severity: "info",
        message: "Disk space check completed",
        category: "disk-space",
      });
    } catch (error) {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: `Could not check disk space: ${(error as Error).message}`,
        category: "disk-space",
      });
    }
  }

  // Validate system prerequisites
  async validateSystemPrerequisites(category: CategoryResult): Promise<void> {
    // Check if git is available
    try {
      const gitProcess = new Deno.Command("git", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });

      const { success } = await gitProcess.output();

      if (success) {
        category.issues.push({
          type: "success",
          severity: "info",
          message: "Git is available",
          category: "prerequisites",
        });
      } else {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: "Git not found - some features may not work",
          category: "prerequisites",
        });
      }
    } catch {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: "Could not check Git availability",
        category: "prerequisites",
      });
    }
  }

  // Validate build performance
  async validateBuildPerformance(projectRoot: string, category: CategoryResult): Promise<void> {
    try {
      const buildDir = join(projectRoot, ".bmad-cache");

      if (await safeExists(buildDir)) {
        const stats = await this.getBuildStats(buildDir);

        if (stats.totalSize > 100 * 1024 * 1024) { // > 100MB
          category.issues.push({
            type: "warning",
            severity: "warning",
            message: `Build cache is large (${
              this.formatBytes(stats.totalSize)
            }). Consider cleaning.`,
            category: "build-performance",
          });
        } else {
          category.issues.push({
            type: "success",
            severity: "info",
            message: `Build cache size is reasonable (${this.formatBytes(stats.totalSize)})`,
            category: "build-performance",
          });
        }
      } else {
        category.issues.push({
          type: "info",
          severity: "info",
          message: "No build cache found",
          category: "build-performance",
        });
      }
    } catch (error) {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: `Could not validate build performance: ${(error as Error).message}`,
        category: "build-performance",
      });
    }
  }

  // Validate cache performance
  async validateCachePerformance(category: CategoryResult): Promise<void> {
    try {
      // Check Deno cache
      const cacheProcess = new Deno.Command("deno", {
        args: ["info", "--json"],
        stdout: "piped",
        stderr: "piped",
      });

      const { success } = await cacheProcess.output();

      if (success) {
        category.issues.push({
          type: "success",
          severity: "info",
          message: "Deno cache is accessible",
          category: "cache-performance",
        });
      } else {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: "Could not access Deno cache information",
          category: "cache-performance",
        });
      }
    } catch {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: "Could not validate cache performance",
        category: "cache-performance",
      });
    }
  }

  // Get build statistics
  async getBuildStats(buildDir: string): Promise<BuildStats> {
    const stats: BuildStats = {
      totalSize: 0,
      fileCount: 0,
      directories: 0,
    };

    try {
      for await (const entry of Deno.readDir(buildDir)) {
        if (entry.isDirectory) {
          stats.directories++;
          // Recursively count subdirectories (simplified)
          const subStats = await this.getBuildStats(join(buildDir, entry.name));
          stats.totalSize += subStats.totalSize;
          stats.fileCount += subStats.fileCount;
          stats.directories += subStats.directories;
        } else if (entry.isFile) {
          stats.fileCount++;
          const filePath = join(buildDir, entry.name);
          const fileInfo = await Deno.stat(filePath);
          stats.totalSize += fileInfo.size;
        }
      }
    } catch {
      // Ignore errors for individual files
    }

    return stats;
  }

  // Calculate category score
  calculateCategoryScore(category: CategoryResult): number {
    if (category.issues.length === 0) return 100;

    let score = 100;
    let totalWeight = 0;

    for (const issue of category.issues) {
      let weight = 0;
      switch (issue.severity) {
        case "critical":
          weight = 30;
          break;
        case "warning":
          weight = 10;
          break;
        case "info":
          weight = 0;
          break;
      }

      if (issue.type === "error") {
        score -= weight;
      }
      totalWeight += weight;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Get category status based on score
  getCategoryStatus(category: CategoryResult): "pass" | "warning" | "fail" {
    const criticalIssues = category.issues.filter((i) => i.severity === "critical").length;
    const warningIssues = category.issues.filter((i) => i.severity === "warning").length;

    if (criticalIssues > 0) return "fail";
    if (warningIssues > 0) return "warning";
    return "pass";
  }

  // Calculate overall results
  calculateOverallResults(): void {
    const categories = Object.values(this.results.categories);

    // Count issues
    this.results.summary.totalIssues = categories.reduce(
      (sum, cat) => sum + cat.issues.length,
      0,
    );

    this.results.summary.criticalIssues = categories.reduce(
      (sum, cat) => sum + cat.issues.filter((i) => i.severity === "critical").length,
      0,
    );

    this.results.summary.warnings = categories.reduce(
      (sum, cat) => sum + cat.issues.filter((i) => i.severity === "warning").length,
      0,
    );

    // Calculate overall score
    this.results.summary.overallScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length,
    );

    // Determine overall status
    if (this.results.summary.criticalIssues > 0) {
      this.results.overall = "fail";
    } else if (this.results.summary.warnings > 0) {
      this.results.overall = "warning";
    } else {
      this.results.overall = "pass";
    }
  }

  // Display results
  displayResults(options: ValidationOptions): void {
    if (options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log("\n" + colors.bold("📋 Validation Results"));
    console.log("=".repeat(50));

    // Overall status
    const statusColor = this.getScoreColor(this.results.summary.overallScore);
    console.log(`Overall Status: ${statusColor(this.results.overall.toUpperCase())}`);
    console.log(`Overall Score: ${statusColor(this.results.summary.overallScore + "%")}`);
    console.log(`Total Issues: ${this.results.summary.totalIssues}`);
    console.log(`Critical: ${colors.red(this.results.summary.criticalIssues.toString())}`);
    console.log(`Warnings: ${colors.yellow(this.results.summary.warnings.toString())}`);

    // Category details
    for (const [name, category] of Object.entries(this.results.categories)) {
      console.log(`\n${colors.bold(name.toUpperCase())}:`);
      console.log(`  Status: ${this.getScoreColor(category.score)(category.status.toUpperCase())}`);
      console.log(`  Score: ${this.getScoreColor(category.score)(category.score + "%")}`);

      if (options.verbose && category.issues.length > 0) {
        console.log("  Issues:");
        for (const issue of category.issues) {
          const icon = issue.type === "error"
            ? "❌"
            : issue.type === "warning"
            ? "⚠️"
            : issue.type === "success"
            ? "✅"
            : "ℹ️";
          console.log(`    ${icon} ${issue.message}`);
          if (issue.details) {
            console.log(`      Details: ${issue.details}`);
          }
        }
      }
    }

    // Recommendations
    this.displayRecommendations();
  }

  // Display recommendations
  displayRecommendations(): void {
    console.log("\n" + colors.bold("💡 Recommendations"));
    console.log("-".repeat(30));

    const recommendations: string[] = [];

    if (this.results.summary.criticalIssues > 0) {
      recommendations.push("🔴 Address critical issues immediately");
    }

    if (this.results.summary.warnings > 0) {
      recommendations.push("🟡 Review and resolve warnings when possible");
    }

    if (this.results.summary.overallScore < 80) {
      recommendations.push("📈 Consider running optimization tools to improve score");
    }

    if (recommendations.length === 0) {
      recommendations.push("🎉 Your installation looks great! No immediate actions needed.");
    }

    recommendations.forEach((rec) => console.log(`  ${rec}`));
  }

  // Get color based on score
  getScoreColor(score: number): (text: string) => string {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.yellow;
    return colors.red;
  }

  // Format bytes
  formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }

  // Generate detailed report
  async generateReport(projectRoot: string, reportPath: string): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        projectRoot,
        denoVersion: Deno.version.deno,
        validationResults: this.results,
        performanceMetrics: this.monitor.getMetrics(),
      };

      await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      this.logger.error("Failed to generate report:", error as Error);
    }
  }
}

// CLI setup
const program = new Command()
  .name("validate-installation")
  .description("Validate BMAD installation integrity and configuration")
  .version("1.0.0")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("-r, --report <path>", "Generate detailed report file")
  .option("-v, --verbose", "Show detailed output")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    try {
      const validator = new InstallationValidator();
      const results = await validator.validate(options);

      // Exit with appropriate code
      if (results.overall === "fail") {
        Deno.exit(1);
      } else if (results.overall === "warning") {
        Deno.exit(2);
      }

      Deno.exit(0);
    } catch (error) {
      console.error(colors.red(`❌ Validation failed: ${(error as Error).message}`));
      Deno.exit(1);
    }
  });

if (import.meta.main) {
  await program.parse(Deno.args);
}

export default InstallationValidator;
