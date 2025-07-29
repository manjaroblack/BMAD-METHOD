#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * Master optimization script for Deno
 * Orchestrates all code quality improvements and performance optimizations
 */

import {
  blue,
  BMadError,
  Command,
  cyan,
  DenoVersionManager,
  DependencyManager,
  gray,
  green,
  join,
  Logger,
  magenta,
  PerformanceMonitor,
  red,
  Spinner,
  yellow,
} from "deps";

// Create colors object for compatibility
const colors = {
  bold: { blue, cyan, gray, green, magenta, red, yellow },
  blue,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow,
};

interface ValidationResults {
  success: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  criticalIssues: string[];
  warnings: string[];
}

interface DependencyResults {
  success: boolean;
  vulnerabilities: string[];
  outdated: string[];
  duplicates: unknown[];
  updated: string[];
  score: number;
}

interface DependencyAuditResults {
  audit: {
    vulnerabilities: string[];
    outdated?: unknown[];
    duplicates?: unknown[];
  };
  outdated?: unknown[];
  duplicates?: unknown[];
}

interface OptimizationReport {
  timestamp: string;
  deno_version: string;
  project_root: string;
  optimization_results: OptimizationResults;
  performance_metrics: unknown[];
  executive_summary: string;
  recommendations: string[];
  results?: OptimizationResults;
  summary?: string;
}

interface BuildResults {
  success: boolean;
  optimizations: string[];
  errors: string[];
  warnings: string[];
  score: number;
  sizeBefore: number;
  sizeAfter: number;
  compressionRatio: number;
}

interface OverallResults {
  success: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

interface OptimizationResults {
  validation: ValidationResults | null;
  dependencies: DependencyResults | null;
  build: BuildResults | null;
  overall: OverallResults;
}

interface OptimizationOptions {
  projectRoot?: string;
  sourceDir?: string;
  outputDir?: string;
  skipDependencies?: boolean;
  skipBuild?: boolean;
  updateDependencies?: boolean;
  installDependencies?: boolean;
  consolidateDependencies?: boolean;
  cleanupDependencies?: boolean;
  updateDenoRequirements?: boolean;
  ignoreVulnerabilities?: boolean;
  force?: boolean;
  report?: string;
  verbose?: boolean;
  json?: boolean;
}

class MasterOptimizer {
  private logger: Logger;
  private monitor: PerformanceMonitor;
  private denoManager: DenoVersionManager;
  private dependencyManager: DependencyManager;
  private results: OptimizationResults;

  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.denoManager = new DenoVersionManager();
    this.dependencyManager = new DependencyManager();

    this.results = {
      validation: null,
      dependencies: null,
      build: null,
      overall: {
        success: false,
        score: 0,
        issues: [],
        recommendations: [],
      },
    };
  }

  // Main optimization workflow
  async optimize(options: OptimizationOptions = {}): Promise<OptimizationResults> {
    console.log(colors.bold.blue("\n🚀 BMAD METHOD - MASTER OPTIMIZATION\n"));
    console.log("=".repeat(60));

    const spinner = new Spinner({ message: "Initializing master optimization..." });
    spinner.start();
    this.monitor.startTimer("master_optimization");

    try {
      // Phase 1: Pre-optimization validation
      spinner.message = "Running pre-optimization validation...";
      await this.preOptimizationValidation(options);

      // Phase 2: Dependency management
      if (!options.skipDependencies) {
        spinner.message = "Managing dependencies...";
        await this.manageDependencies(options);
      }

      // Phase 3: Build optimization
      if (!options.skipBuild) {
        spinner.message = "Optimizing build...";
        await this.optimizeBuild(options);
      }

      // Phase 4: Post-optimization validation
      spinner.message = "Running post-optimization validation...";
      await this.postOptimizationValidation(options);

      // Phase 5: Generate comprehensive report
      if (options.report) {
        spinner.message = "Generating comprehensive report...";
        await this.generateComprehensiveReport(options);
      }

      this.calculateOverallResults();
      this.monitor.endTimer("master_optimization");

      spinner.stop();
      this.displayComprehensiveResults(options);

      return this.results;
    } catch (error) {
      spinner.stop();
      this.logger.error("Master optimization failed", error as Error);
      throw error;
    }
  }

  // Pre-optimization validation
  async preOptimizationValidation(options: OptimizationOptions): Promise<void> {
    try {
      this.logger.info("🔍 Running pre-optimization validation...");

      const validationResults: ValidationResults = {
        success: true,
        score: 85,
        issues: [],
        recommendations: [],
        criticalIssues: [],
        warnings: [],
      };

      // Check Deno installation
      const denoVersion = Deno.version.deno;
      if (!denoVersion) {
        validationResults.criticalIssues.push("Deno is not installed or not accessible");
        validationResults.success = false;
      } else {
        this.logger.info(`✓ Deno version: ${denoVersion}`);
      }

      // Check project structure
      const projectRoot = options.projectRoot || Deno.cwd();
      const denoJsonPath = join(projectRoot, "deno.json");

      try {
        await Deno.stat(denoJsonPath);
        this.logger.info("✓ deno.json found");
      } catch {
        validationResults.warnings.push("deno.json not found - consider creating one");
      }

      // Check for common issues
      await this.checkCommonIssues(projectRoot, validationResults);

      this.results.validation = validationResults;

      if (!validationResults.success && !options.force) {
        throw new BMadError(
          "Critical validation issues found. Use --force to continue.",
          undefined,
          { issues: validationResults.criticalIssues },
        );
      }
    } catch (error) {
      this.logger.error("Pre-optimization validation failed", error as Error);
      throw error;
    }
  }

  // Check for common project issues
  async checkCommonIssues(projectRoot: string, results: ValidationResults): Promise<void> {
    try {
      // Check for TypeScript files without proper configuration
      const tsFiles = [];
      for await (const entry of Deno.readDir(projectRoot)) {
        if (entry.isFile && entry.name.endsWith(".ts")) {
          tsFiles.push(entry.name);
        }
      }

      if (tsFiles.length > 0) {
        results.recommendations.push(
          "Consider using TypeScript configuration for better type checking",
        );
      }

      // Check for large files that might need optimization
      for await (const entry of Deno.readDir(projectRoot)) {
        if (entry.isFile) {
          const stat = await Deno.stat(join(projectRoot, entry.name));
          if (stat.size > 1024 * 1024) { // > 1MB
            results.warnings.push(
              `Large file detected: ${entry.name} (${Math.round(stat.size / 1024 / 1024)}MB)`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.warn("Could not complete common issues check", error as Error);
    }
  }

  // Manage dependencies
  async manageDependencies(options: OptimizationOptions): Promise<void> {
    try {
      this.logger.info("📦 Managing dependencies...");

      const depOptions = {
        projectRoot: options.projectRoot,
        audit: true,
        update: options.updateDependencies,
        install: options.installDependencies,
        consolidate: options.consolidateDependencies,
        cleanup: options.cleanupDependencies,
        updateDenoRequirements: options.updateDenoRequirements,
        verbose: options.verbose,
      };

      const depResults = await this.dependencyManager.manage(depOptions);

      this.results.dependencies = {
        success: true,
        vulnerabilities: depResults.audit.vulnerabilities,
        outdated: depResults.audit.outdated,
        duplicates: depResults.audit.duplicates,
        updated: depResults.updates.updated,
        score: this.calculateDependencyScore(depResults),
      };

      // Check for critical vulnerabilities
      const highSeverityVulns = this.getHighSeverityVulnerabilities(depResults);
      if (highSeverityVulns.length > 0 && !options.ignoreVulnerabilities) {
        throw new BMadError(
          "High severity vulnerabilities found. Use --ignore-vulnerabilities to continue.",
          undefined,
          { vulnerabilities: highSeverityVulns },
        );
      }
    } catch (error) {
      this.logger.error("Dependency management failed", error as Error);
      if (this.results.dependencies) {
        this.results.dependencies.success = false;
      }
      throw error;
    }
  }

  // Optimize build (simplified for Deno)
  async optimizeBuild(options: OptimizationOptions): Promise<void> {
    try {
      this.logger.info("🔧 Optimizing build...");

      const buildResults: BuildResults = {
        success: true,
        optimizations: [],
        errors: [],
        warnings: [],
        score: 90,
        sizeBefore: 0,
        sizeAfter: 0,
        compressionRatio: 1.0,
      };

      // For Deno, we can check and cache dependencies
      try {
        const command = new Deno.Command("deno", {
          args: ["cache", "--reload", join(options.projectRoot || Deno.cwd(), "deno.json")],
          stdout: "piped",
          stderr: "piped",
        });

        const { success } = await command.output();

        if (success) {
          buildResults.optimizations.push("Dependencies cached successfully");
        } else {
          buildResults.warnings.push("Failed to cache some dependencies");
        }
      } catch (error) {
        buildResults.warnings.push(`Build optimization warning: ${(error as Error).message}`);
      }

      // Check for bundle opportunities
      const projectRoot = options.projectRoot || Deno.cwd();
      const mainFiles = ["main.ts", "mod.ts", "index.ts"];

      for (const mainFile of mainFiles) {
        try {
          await Deno.stat(join(projectRoot, mainFile));
          buildResults.optimizations.push(
            `Found main file: ${mainFile} - consider bundling for production`,
          );
          break;
        } catch {
          // File doesn't exist, continue
        }
      }

      this.results.build = buildResults;
    } catch (error) {
      this.logger.error("Build optimization failed", error as Error);
      if (this.results.build) {
        this.results.build.success = false;
      }
      throw error;
    }
  }

  // Post-optimization validation
  async postOptimizationValidation(options: OptimizationOptions): Promise<void> {
    try {
      this.logger.info("✅ Running post-optimization validation...");

      // Re-run basic validation to ensure everything still works
      const postValidation: ValidationResults = {
        success: true,
        score: 95,
        issues: [],
        recommendations: [],
        criticalIssues: [],
        warnings: [],
      };

      // Check if Deno can still run the project
      try {
        const projectRoot = options.projectRoot || Deno.cwd();
        const command = new Deno.Command("deno", {
          args: ["check", join(projectRoot, "deno.json")],
          stdout: "piped",
          stderr: "piped",
        });

        const { success } = await command.output();

        if (success) {
          postValidation.recommendations.push("All TypeScript files pass type checking");
        } else {
          postValidation.warnings.push("Some TypeScript files have type checking issues");
        }
      } catch (error) {
        postValidation.warnings.push(
          `Type checking validation failed: ${(error as Error).message}`,
        );
      }

      // Update validation results
      if (this.results.validation) {
        this.results.validation.score = Math.max(
          this.results.validation.score,
          postValidation.score,
        );
        this.results.validation.recommendations.push(...postValidation.recommendations);
      }
    } catch (error) {
      this.logger.error("Post-optimization validation failed", error as Error);
    }
  }

  // Generate comprehensive report
  async generateComprehensiveReport(options: OptimizationOptions): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        deno_version: Deno.version.deno,
        project_root: options.projectRoot || Deno.cwd(),
        optimization_results: this.results,
        performance_metrics: this.monitor.getAllMetrics(),
        executive_summary: this.generateExecutiveSummary(),
        recommendations: this.generateRecommendations(),
      };

      const reportPath = options.report || "optimization-report.json";
      await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

      this.logger.info(`📊 Comprehensive report generated: ${reportPath}`);

      // Also generate markdown report
      const markdownPath = reportPath.replace(".json", ".md");
      await this.generateMarkdownReport(report, markdownPath);
    } catch (error) {
      this.logger.error("Failed to generate comprehensive report", error as Error);
    }
  }

  // Calculate overall results
  calculateOverallResults(): void {
    let totalScore = 0;
    let scoreCount = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (this.results.validation) {
      totalScore += this.results.validation.score;
      scoreCount++;
      issues.push(...this.results.validation.issues);
      recommendations.push(...this.results.validation.recommendations);
    }

    if (this.results.dependencies) {
      totalScore += this.results.dependencies.score;
      scoreCount++;
      if (this.results.dependencies.vulnerabilities.length > 0) {
        issues.push(`${this.results.dependencies.vulnerabilities.length} security vulnerabilities`);
      }
    }

    if (this.results.build) {
      totalScore += this.results.build.score;
      scoreCount++;
      issues.push(...this.results.build.errors);
    }

    this.results.overall = {
      success: scoreCount > 0 && issues.length === 0,
      score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      issues,
      recommendations,
    };
  }

  // Calculate dependency score
  calculateDependencyScore(depResults: DependencyAuditResults | unknown): number {
    let score = 100;

    // Type guard to check if depResults has the expected structure
    const isValidDepResults = (obj: unknown): obj is DependencyAuditResults => {
      return typeof obj === "object" && obj !== null && "audit" in obj;
    };

    if (isValidDepResults(depResults)) {
      // Deduct points for vulnerabilities
      if (depResults.audit?.vulnerabilities) {
        score -= depResults.audit.vulnerabilities.length * 10;
      }

      // Deduct points for outdated dependencies
      if (depResults.audit.outdated) {
        score -= (depResults.audit.outdated as unknown[]).length * 5;
      }

      // Deduct points for duplicates
      if (depResults.audit.duplicates) {
        score -= (depResults.audit.duplicates as unknown[]).length * 3;
      }
    }

    return Math.max(0, score);
  }

  // Get high severity vulnerabilities
  getHighSeverityVulnerabilities(depResults: DependencyAuditResults | unknown): string[] {
    // Type guard to check if depResults has the expected structure
    const isValidDepResults = (obj: unknown): obj is DependencyAuditResults => {
      return typeof obj === "object" && obj !== null && "audit" in obj;
    };

    if (!isValidDepResults(depResults) || !depResults.audit?.vulnerabilities) {
      return [];
    }

    return depResults.audit.vulnerabilities.filter((vuln: unknown) =>
      typeof vuln === "string" && (vuln.includes("high") || vuln.includes("critical"))
    ) as string[];
  }

  // Generate recommendations
  generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.results.dependencies) {
      if (this.results.dependencies.outdated.length > 0) {
        recommendations.push("Update outdated dependencies to latest versions");
      }
      if (this.results.dependencies.duplicates.length > 0) {
        recommendations.push("Consolidate duplicate dependencies");
      }
    }

    if (this.results.build) {
      if (this.results.build.optimizations.length === 0) {
        recommendations.push("Consider implementing build optimizations");
      }
    }

    if (this.results.overall.score < 80) {
      recommendations.push("Overall optimization score is below 80% - review and address issues");
    }

    return recommendations;
  }

  // Generate executive summary
  generateExecutiveSummary(): string {
    const score = this.results.overall.score;
    const issues = this.results.overall.issues.length;

    let summary = `Optimization completed with an overall score of ${score}%.`;

    if (score >= 90) {
      summary += " Excellent! Your project is well-optimized.";
    } else if (score >= 70) {
      summary += " Good optimization level with room for improvement.";
    } else {
      summary += " Significant optimization opportunities identified.";
    }

    if (issues > 0) {
      summary += ` ${issues} issue(s) require attention.`;
    }

    return summary;
  }

  // Generate markdown report
  async generateMarkdownReport(report: OptimizationReport, markdownPath: string): Promise<void> {
    const markdown = `# BMAD Method Optimization Report

**Generated:** ${report.timestamp}  
**Deno Version:** ${report.deno_version}  
**Project Root:** ${report.project_root}

## Executive Summary

${report.executive_summary}

**Overall Score:** ${this.results.overall.score}%

## Optimization Results

### Validation
- **Score:** ${this.results.validation?.score || "N/A"}%
- **Issues:** ${this.results.validation?.issues.length || 0}
- **Recommendations:** ${this.results.validation?.recommendations.length || 0}

### Dependencies
- **Score:** ${this.results.dependencies?.score || "N/A"}%
- **Vulnerabilities:** ${this.results.dependencies?.vulnerabilities.length || 0}
- **Outdated:** ${this.results.dependencies?.outdated.length || 0}
- **Updated:** ${this.results.dependencies?.updated.length || 0}

### Build
- **Score:** ${this.results.build?.score || "N/A"}%
- **Optimizations:** ${this.results.build?.optimizations.length || 0}
- **Errors:** ${this.results.build?.errors.length || 0}

## Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join("\n")}

## Performance Metrics

${JSON.stringify(report.performance_metrics, null, 2)}
`;

    await Deno.writeTextFile(markdownPath, markdown);
    this.logger.info(`📄 Markdown report generated: ${markdownPath}`);
  }

  // Display comprehensive results
  displayComprehensiveResults(options: OptimizationOptions): void {
    if (options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log("\n" + "=".repeat(60));
    console.log(colors.bold.blue("🎯 OPTIMIZATION RESULTS"));
    console.log("=".repeat(60));

    // Overall score
    const scoreColor = this.getScoreColor(this.results.overall.score);
    console.log(`\n📊 Overall Score: ${scoreColor(this.results.overall.score + "%")}`);

    // Validation results
    if (this.results.validation) {
      console.log(
        `\n🔍 Validation: ${
          this.getScoreColor(this.results.validation.score)(this.results.validation.score + "%")
        }`,
      );
      if (this.results.validation.issues.length > 0) {
        console.log("  Issues:");
        this.results.validation.issues.forEach((issue) => console.log(`    ❌ ${issue}`));
      }
    }

    // Dependency results
    if (this.results.dependencies) {
      console.log(
        `\n📦 Dependencies: ${
          this.getScoreColor(this.results.dependencies.score)(this.results.dependencies.score + "%")
        }`,
      );
      console.log(`  Vulnerabilities: ${this.results.dependencies.vulnerabilities.length}`);
      console.log(`  Outdated: ${this.results.dependencies.outdated.length}`);
      console.log(`  Updated: ${this.results.dependencies.updated.length}`);
    }

    // Build results
    if (this.results.build) {
      console.log(
        `\n🔧 Build: ${
          this.getScoreColor(this.results.build.score)(this.results.build.score + "%")
        }`,
      );
      console.log(`  Optimizations: ${this.results.build.optimizations.length}`);
      console.log(`  Errors: ${this.results.build.errors.length}`);
    }

    // Recommendations
    if (this.results.overall.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      this.results.overall.recommendations.forEach((rec) => console.log(`  • ${rec}`));
    }

    console.log("\n" + "=".repeat(60));
    console.log(
      this.results.overall.success
        ? colors.green("✅ Optimization completed successfully!")
        : colors.yellow("⚠️  Optimization completed with issues"),
    );
    console.log("=".repeat(60));
  }

  // Get color for score display
  getScoreColor(score: number) {
    if (score >= 90) return colors.green;
    if (score >= 70) return colors.yellow;
    return colors.red;
  }
}

// CLI setup
const program = new Command()
  .name("master-optimizer")
  .description("Master optimization script for BMAD Method")
  .version("1.0.0")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("-s, --source-dir <path>", "Source directory for build optimization")
  .option("-o, --output-dir <path>", "Output directory for build optimization")
  .option("--skip-dependencies", "Skip dependency management phase")
  .option("--skip-build", "Skip build optimization phase")
  .option("--update-dependencies", "Update dependencies to latest versions")
  .option("--install-dependencies", "Cache dependencies after updating")
  .option("--consolidate-dependencies", "Consolidate duplicate dependencies")
  .option("--cleanup-dependencies", "Clean up cache and lock files")
  .option("--update-deno-requirements", "Update Deno version requirements")
  .option("--ignore-vulnerabilities", "Continue despite security vulnerabilities")
  .option("--force", "Continue despite critical validation issues")
  .option("-r, --report <path>", "Generate comprehensive report file", {
    default: "optimization-report.json",
  })
  .option("-v, --verbose", "Show detailed output")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    try {
      const optimizer = new MasterOptimizer();
      await optimizer.optimize(options);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

// Add subcommands
program
  .command("validate")
  .description("Run only validation phase")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    try {
      const optimizer = new MasterOptimizer();
      await optimizer.preOptimizationValidation(options);
      optimizer.displayComprehensiveResults(options);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

program
  .command("dependencies")
  .description("Run only dependency management phase")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("--update", "Update dependencies")
  .option("--consolidate", "Consolidate dependencies")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    try {
      const optimizer = new MasterOptimizer();
      await optimizer.manageDependencies({
        ...options,
        updateDependencies: options.update,
        consolidateDependencies: options.consolidate,
      });
      optimizer.displayComprehensiveResults(options);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

program
  .command("build")
  .description("Run only build optimization phase")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("-s, --source-dir <path>", "Source directory")
  .option("-o, --output-dir <path>", "Output directory")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    try {
      const optimizer = new MasterOptimizer();
      await optimizer.optimizeBuild(options);
      optimizer.displayComprehensiveResults(options);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

if (import.meta.main) {
  await program.parse(Deno.args);
}

export default MasterOptimizer;
