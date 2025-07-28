#!/usr/bin/env node
/**
 * Installation validation script
 * Comprehensive validation for BMAD installations with detailed reporting
 */

import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { program } from "commander";
import yaml from "js-yaml";
import { BMadError, Logger } from "../lib/error-handler.js";
import { PerformanceMonitor } from "../lib/performance-optimizer.js";
import NodeVersionManager from "../lib/node-version-manager.js";
import InstallerValidator from "../installers/lib/installer-validator.js";
import process from "node:process";

class InstallationValidator {
  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.nodeManager = new NodeVersionManager();
    this.validator = new InstallerValidator();
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
  async validate(options = {}) {
    const spinner = ora("Starting installation validation...").start();
    this.monitor.startTimer("full_validation");

    try {
      // Step 1: Validate environment
      spinner.text = "Validating environment...";
      await this.validateEnvironment(options.projectRoot);

      // Step 2: Validate installation integrity
      spinner.text = "Validating installation integrity...";
      await this.validateInstallation(options.projectRoot);

      // Step 3: Validate configuration
      spinner.text = "Validating configuration...";
      await this.validateConfiguration(options.projectRoot);

      // Step 4: Performance validation
      spinner.text = "Validating performance...";
      await this.validatePerformance(options.projectRoot);

      // Calculate overall results
      this.calculateOverallResults();

      this.monitor.endTimer("full_validation");

      if (this.results.overall === "pass") {
        spinner.succeed("Installation validation completed successfully");
      } else if (this.results.overall === "warning") {
        spinner.warn("Installation validation completed with warnings");
      } else {
        spinner.fail("Installation validation failed");
      }

      // Display results
      this.displayResults(options);

      // Generate report if requested
      if (options.report) {
        await this.generateReport(options.projectRoot, options.report);
      }

      return this.results;
    } catch (error) {
      this.monitor.endTimer("full_validation");
      spinner.fail(`Validation failed: ${error.message}`);
      this.logger.error("Validation error:", error);
      throw new BMadError(
        "VALIDATION_FAILED",
        `Installation validation failed: ${error.message}`,
      );
    }
  }

  // Validate environment and prerequisites
  async validateEnvironment(projectRoot) {
    const category = this.results.categories.environment;

    try {
      // Node.js version validation
      const nodeValidation = this.nodeManager.validateVersion();
      if (!nodeValidation.valid) {
        nodeValidation.issues.forEach((issue) => {
          category.issues.push({
            type: issue.type,
            severity: issue.type === "error" ? "critical" : "warning",
            message: issue.message,
            category: "nodejs",
          });
        });
      } else {
        category.issues.push({
          type: "success",
          severity: "info",
          message: `Node.js version ${nodeValidation.current} is compatible`,
          category: "nodejs",
        });
      }

      // npm version validation
      const npmCheck = await this.nodeManager.checkNpmVersion();
      if (!npmCheck.compatible) {
        npmCheck.issues.forEach((issue) => {
          category.issues.push({
            type: issue.type,
            severity: issue.type === "error" ? "critical" : "warning",
            message: issue.message,
            category: "npm",
          });
        });
      } else {
        category.issues.push({
          type: "success",
          severity: "info",
          message: `npm version ${npmCheck.current} is compatible`,
          category: "npm",
        });
      }

      // System prerequisites
      const prereqIssues = await this.validator.validatePrerequisites();
      prereqIssues.forEach((issue) => {
        category.issues.push({
          type: issue.type,
          severity: issue.type === "error"
            ? "critical"
            : issue.type === "warning"
            ? "warning"
            : "info",
          message: issue.message,
          category: "system",
        });
      });

      // Check for conflicting installations
      if (projectRoot) {
        const conflicts = await this.checkConflictingInstallations(projectRoot);
        conflicts.forEach((conflict) => {
          category.issues.push({
            type: "warning",
            severity: "warning",
            message: conflict.message,
            category: "conflicts",
          });
        });
      }
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Environment validation failed: ${error.message}`,
        category: "validation",
      });
    }

    this.calculateCategoryScore(category);
  }

  // Validate installation integrity
  async validateInstallation(projectRoot) {
    const category = this.results.categories.installation;

    if (!projectRoot) {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: "No project root specified, skipping installation validation",
        category: "setup",
      });
      this.calculateCategoryScore(category);
      return;
    }

    try {
      // Validate installation integrity
      const integrityIssues = await this.validator
        .validateInstallation(projectRoot);
      integrityIssues.forEach((issue) => {
        category.issues.push({
          type: issue.type,
          severity: issue.type === "error"
            ? "critical"
            : issue.type === "warning"
            ? "warning"
            : "info",
          message: issue.message,
          category: "integrity",
        });
      });

      // Check core files
      const coreFiles = await this.validateCoreFiles(projectRoot);
      coreFiles.forEach((issue) => {
        category.issues.push(issue);
      });

      // Check expansion packs
      const expansionPacks = await this.validateExpansionPacks(projectRoot);
      expansionPacks.forEach((issue) => {
        category.issues.push(issue);
      });

      // Check for orphaned files
      const orphanedFiles = await this.findOrphanedFiles(projectRoot);
      if (orphanedFiles.length > 0) {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: `Found ${orphanedFiles.length} orphaned files`,
          category: "cleanup",
          details: orphanedFiles.slice(0, 10), // Show first 10
        });
      }
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Installation validation failed: ${error.message}`,
        category: "validation",
      });
    }

    this.calculateCategoryScore(category);
  }

  // Validate configuration files
  async validateConfiguration(projectRoot) {
    const category = this.results.categories.configuration;

    if (!projectRoot) {
      category.issues.push({
        type: "warning",
        severity: "warning",
        message: "No project root specified, skipping configuration validation",
        category: "setup",
      });
      this.calculateCategoryScore(category);
      return;
    }

    try {
      // Validate core configuration
      const coreConfigPath = path.join(
        projectRoot,
        "src",
        "core",
        "core-config.yaml",
      );
      if (await fs.pathExists(coreConfigPath)) {
        const configValidation = await this.validateYamlFile(
          coreConfigPath,
          "core-config",
        );
        category.issues.push(...configValidation);
      } else {
        category.issues.push({
          type: "error",
          severity: "critical",
          message: "Core configuration file not found",
          category: "config",
          path: coreConfigPath,
        });
      }

      // Validate bmad configuration
      const bmadConfigPath = path.join(
        projectRoot,
        "config",
        "bmad.config.yaml",
      );
      if (await fs.pathExists(bmadConfigPath)) {
        const configValidation = await this.validateYamlFile(
          bmadConfigPath,
          "bmad-config",
        );
        category.issues.push(...configValidation);
      } else {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message: "BMAD configuration file not found",
          category: "config",
          path: bmadConfigPath,
        });
      }

      // Validate package.json files
      const packageJsonValidation = await this.validatePackageJsonFiles(
        projectRoot,
      );
      category.issues.push(...packageJsonValidation);
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Configuration validation failed: ${error.message}`,
        category: "validation",
      });
    }

    this.calculateCategoryScore(category);
  }

  // Validate performance aspects
  async validatePerformance(projectRoot) {
    const category = this.results.categories.performance;

    try {
      // Check Node.js performance characteristics
      const perfInfo = this.nodeManager.getVersionInfo();
      if (perfInfo.performance && perfInfo.performance.score < 0.8) {
        category.issues.push({
          type: "warning",
          severity: "warning",
          message:
            `Node.js version has performance limitations (score: ${perfInfo.performance.score})`,
          category: "nodejs",
        });
      }

      // Check disk space
      if (projectRoot) {
        const diskSpace = await this.checkDiskSpace(projectRoot);
        if (diskSpace.available < 1024 * 1024 * 100) { // Less than 100MB
          category.issues.push({
            type: "warning",
            severity: "warning",
            message: `Low disk space: ${
              this.formatBytes(diskSpace.available)
            } available`,
            category: "disk",
          });
        }
      }

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 1024 * 1024 * 500) { // More than 500MB
        category.issues.push({
          type: "info",
          severity: "info",
          message: `High memory usage: ${
            this.formatBytes(memoryUsage.heapUsed)
          }`,
          category: "memory",
        });
      }

      // Validate build performance if build directory exists
      if (projectRoot) {
        const buildPerf = await this.validateBuildPerformance(projectRoot);
        category.issues.push(...buildPerf);
      }
    } catch (error) {
      category.issues.push({
        type: "error",
        severity: "critical",
        message: `Performance validation failed: ${error.message}`,
        category: "validation",
      });
    }

    this.calculateCategoryScore(category);
  }

  // Validate core files
  async validateCoreFiles(projectRoot) {
    const issues = [];
    const coreFiles = [
      "src/core/core-config.yaml",
      "src/core/bmad-method.md",
      "package.json",
      "README.md",
    ];

    for (const file of coreFiles) {
      const filePath = path.join(projectRoot, file);
      if (!(await fs.pathExists(filePath))) {
        issues.push({
          type: "error",
          severity: "critical",
          message: `Core file missing: ${file}`,
          category: "core-files",
          path: filePath,
        });
      } else {
        // Check file size and basic validity
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          issues.push({
            type: "warning",
            severity: "warning",
            message: `Core file is empty: ${file}`,
            category: "core-files",
            path: filePath,
          });
        }
      }
    }

    return issues;
  }

  // Validate expansion packs
  async validateExpansionPacks(projectRoot) {
    const issues = [];
    const expansionDir = path.join(projectRoot, "src", "expansion-packs");

    if (!(await fs.pathExists(expansionDir))) {
      issues.push({
        type: "info",
        severity: "info",
        message: "No expansion packs directory found",
        category: "expansion-packs",
      });
      return issues;
    }

    try {
      const packs = await fs.readdir(expansionDir, { withFileTypes: true });
      const packDirs = packs.filter((p) => p.isDirectory());

      for (const pack of packDirs) {
        const packPath = path.join(expansionDir, pack.name);
        const configPath = path.join(packPath, "config.yaml");

        if (!(await fs.pathExists(configPath))) {
          issues.push({
            type: "warning",
            severity: "warning",
            message: `Expansion pack missing config: ${pack.name}`,
            category: "expansion-packs",
            path: configPath,
          });
        }
      }

      issues.push({
        type: "success",
        severity: "info",
        message: `Found ${packDirs.length} expansion packs`,
        category: "expansion-packs",
      });
    } catch (error) {
      issues.push({
        type: "error",
        severity: "critical",
        message: `Failed to validate expansion packs: ${error.message}`,
        category: "expansion-packs",
      });
    }

    return issues;
  }

  // Find orphaned files
  async findOrphanedFiles(projectRoot) {
    const orphaned = [];
    const suspiciousPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /\.bak$/,
      /\.old$/,
      /~$/,
      /\.DS_Store$/,
      /Thumbs\.db$/,
    ];

    try {
      const walk = async (dir, relativePath = "") => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);

          if (entry.isFile()) {
            if (
              suspiciousPatterns.some((pattern) => pattern.test(entry.name))
            ) {
              orphaned.push(relPath);
            }
          } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
            await walk(fullPath, relPath);
          }
        }
      };

      await walk(projectRoot);
    } catch (error) {
      this.logger.warn(`Failed to scan for orphaned files: ${error.message}`);
    }

    return orphaned;
  }

  // Validate YAML file
  async validateYamlFile(filePath, type) {
    const issues = [];

    try {
      const content = await fs.readFile(filePath, "utf8");
      const parsed = yaml.load(content);

      if (!parsed || typeof parsed !== "object") {
        issues.push({
          type: "error",
          severity: "critical",
          message: `Invalid YAML structure in ${type}`,
          category: "config",
          path: filePath,
        });
      } else {
        issues.push({
          type: "success",
          severity: "info",
          message: `Valid YAML structure in ${type}`,
          category: "config",
          path: filePath,
        });
      }
    } catch (error) {
      issues.push({
        type: "error",
        severity: "critical",
        message: `Failed to parse ${type}: ${error.message}`,
        category: "config",
        path: filePath,
      });
    }

    return issues;
  }

  // Validate package.json files
  async validatePackageJsonFiles(projectRoot) {
    const issues = [];
    const packageJsonPaths = [
      path.join(projectRoot, "package.json"),
      path.join(projectRoot, "tooling", "installers", "package.json"),
    ];

    for (const pkgPath of packageJsonPaths) {
      if (await fs.pathExists(pkgPath)) {
        try {
          const content = await fs.readJson(pkgPath);

          // Check required fields
          const requiredFields = ["name", "version"];
          for (const field of requiredFields) {
            if (!content[field]) {
              issues.push({
                type: "error",
                severity: "critical",
                message: `Missing required field '${field}' in ${
                  path.relative(projectRoot, pkgPath)
                }`,
                category: "package-json",
                path: pkgPath,
              });
            }
          }

          // Check engines field
          if (!content.engines || !content.engines.node) {
            issues.push({
              type: "warning",
              severity: "warning",
              message: `Missing Node.js engine specification in ${
                path.relative(projectRoot, pkgPath)
              }`,
              category: "package-json",
              path: pkgPath,
            });
          }
        } catch (error) {
          issues.push({
            type: "error",
            severity: "critical",
            message: `Invalid package.json: ${
              path.relative(projectRoot, pkgPath)
            } - ${error.message}`,
            category: "package-json",
            path: pkgPath,
          });
        }
      }
    }

    return issues;
  }

  // Check for conflicting installations
  async checkConflictingInstallations(projectRoot) {
    const conflicts = [];

    // Check for multiple BMAD installations
    const possiblePaths = [
      path.join(projectRoot, "..", "bmad-method"),
      path.join(projectRoot, "..", "BMAD-METHOD"),
      path.join(projectRoot, "..", "bmad"),
    ];

    for (const checkPath of possiblePaths) {
      if (await fs.pathExists(checkPath) && checkPath !== projectRoot) {
        conflicts.push({
          message: `Potential conflicting installation found: ${checkPath}`,
          path: checkPath,
        });
      }
    }

    return conflicts;
  }

  // Check disk space
  async checkDiskSpace(projectRoot) {
    try {
      const stats = await fs.stat(projectRoot);
      // This is a simplified check - in a real implementation,
      // you'd use a library like 'check-disk-space'
      return {
        available: 1024 * 1024 * 1024 * 10, // Assume 10GB available
        total: 1024 * 1024 * 1024 * 100, // Assume 100GB total
      };
    } catch (error) {
      return {
        available: 0,
        total: 0,
        error: error.message,
      };
    }
  }

  // Validate build performance
  async validateBuildPerformance(projectRoot) {
    const issues = [];
    const buildDir = path.join(projectRoot, "build");

    if (await fs.pathExists(buildDir)) {
      try {
        const stats = await this.getBuildStats(buildDir);

        if (stats.totalSize > 1024 * 1024 * 100) { // > 100MB
          issues.push({
            type: "warning",
            severity: "warning",
            message: `Large build size: ${this.formatBytes(stats.totalSize)}`,
            category: "build-performance",
          });
        }

        if (stats.fileCount > 1000) {
          issues.push({
            type: "info",
            severity: "info",
            message: `High file count in build: ${stats.fileCount} files`,
            category: "build-performance",
          });
        }
      } catch (error) {
        issues.push({
          type: "warning",
          severity: "warning",
          message: `Failed to analyze build performance: ${error.message}`,
          category: "build-performance",
        });
      }
    }

    return issues;
  }

  // Get build statistics
  async getBuildStats(buildDir) {
    const stats = { totalSize: 0, fileCount: 0 };

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          stats.fileCount++;
          const fileStat = await fs.stat(fullPath);
          stats.totalSize += fileStat.size;
        }
      }
    };

    await walk(buildDir);
    return stats;
  }

  // Calculate category score
  calculateCategoryScore(category) {
    const critical =
      category.issues.filter((i) => i.severity === "critical").length;
    const warnings =
      category.issues.filter((i) => i.severity === "warning").length;
    const total = category.issues.length;

    if (critical > 0) {
      category.status = "fail";
      category.score = Math.max(0, 50 - (critical * 25));
    } else if (warnings > 0) {
      category.status = "warning";
      category.score = Math.max(50, 100 - (warnings * 10));
    } else if (total > 0) {
      category.status = "pass";
      category.score = 100;
    } else {
      category.status = "unknown";
      category.score = 0;
    }
  }

  // Calculate overall results
  calculateOverallResults() {
    const categories = Object.values(this.results.categories);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const avgScore = totalScore / categories.length;

    this.results.summary.overallScore = Math.round(avgScore);

    // Count issues
    categories.forEach((category) => {
      category.issues.forEach((issue) => {
        this.results.summary.totalIssues++;
        if (issue.severity === "critical") {
          this.results.summary.criticalIssues++;
        } else if (issue.severity === "warning") {
          this.results.summary.warnings++;
        }
      });
    });

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
  displayResults(options) {
    console.log("\n" + "=".repeat(60));
    console.log(chalk.bold("BMAD INSTALLATION VALIDATION REPORT"));
    console.log("=".repeat(60));

    // Overall status
    const statusColor = this.results.overall === "pass"
      ? "green"
      : this.results.overall === "warning"
      ? "yellow"
      : "red";
    const statusIcon = this.results.overall === "pass"
      ? "✅"
      : this.results.overall === "warning"
      ? "⚠️"
      : "❌";

    console.log(
      `\n${statusIcon} Overall Status: ${
        chalk[statusColor](this.results.overall.toUpperCase())
      }`,
    );
    console.log(
      `📊 Overall Score: ${
        this.getScoreColor(this.results.summary.overallScore)
      }${this.results.summary.overallScore}/100`,
    );
    console.log(
      `🔍 Total Issues: ${this.results.summary.totalIssues} (${this.results.summary.criticalIssues} critical, ${this.results.summary.warnings} warnings)`,
    );

    // Category results
    console.log("\n" + chalk.bold("CATEGORY BREAKDOWN:"));
    Object.entries(this.results.categories).forEach(([name, category]) => {
      const icon = category.status === "pass"
        ? "✅"
        : category.status === "warning"
        ? "⚠️"
        : category.status === "fail"
        ? "❌"
        : "❓";

      console.log(
        `\n${icon} ${chalk.bold(name.toUpperCase())} - Score: ${
          this.getScoreColor(category.score)
        }${category.score}/100`,
      );

      if (options.verbose || category.status !== "pass") {
        category.issues.forEach((issue) => {
          const issueIcon = issue.severity === "critical"
            ? "🔴"
            : issue.severity === "warning"
            ? "🟡"
            : "🔵";
          console.log(`  ${issueIcon} ${issue.message}`);
          if (issue.details && options.verbose) {
            issue.details.forEach((detail) => {
              console.log(`     • ${detail}`);
            });
          }
        });
      }
    });

    // Performance info
    const validationTime = this.monitor.getTimer("full_validation");
    console.log(`\n⏱️  Validation completed in ${validationTime}ms`);

    // Recommendations
    this.displayRecommendations();
  }

  // Display recommendations
  displayRecommendations() {
    const recommendations = [];

    if (this.results.summary.criticalIssues > 0) {
      recommendations.push(
        "Address critical issues immediately before proceeding",
      );
    }

    if (this.results.categories.environment.score < 80) {
      recommendations.push("Update Node.js and npm to recommended versions");
    }

    if (this.results.categories.configuration.score < 80) {
      recommendations.push("Review and fix configuration file issues");
    }

    if (this.results.categories.performance.score < 80) {
      recommendations.push("Consider performance optimizations");
    }

    if (recommendations.length > 0) {
      console.log("\n" + chalk.yellow.bold("RECOMMENDATIONS:"));
      recommendations.forEach((rec, index) => {
        console.log(chalk.yellow(`${index + 1}. ${rec}`));
      });
    }
  }

  // Get score color
  getScoreColor(score) {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    return chalk.red;
  }

  // Format bytes
  formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }

  // Generate detailed report
  async generateReport(projectRoot, reportPath) {
    const report = {
      timestamp: new Date().toISOString(),
      validation: this.results,
      environment: {
        nodeVersion: this.nodeManager.getVersionInfo(),
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
      },
      performance: {
        validationTime: this.monitor.getTimer("full_validation"),
        metrics: this.monitor.getAllMetrics(),
      },
    };

    const fullReportPath = path.resolve(
      projectRoot || process.cwd(),
      reportPath,
    );
    await fs.writeJson(fullReportPath, report, { spaces: 2 });

    console.log(`\n📄 Detailed report saved to: ${fullReportPath}`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name("validate-installation")
    .description("Validate BMAD installation integrity and configuration")
    .option(
      "-p, --project-root <path>",
      "Project root directory",
      process.cwd(),
    )
    .option("-r, --report <path>", "Generate detailed report file")
    .option("-v, --verbose", "Show detailed output")
    .option("--json", "Output results as JSON")
    .action(async (options) => {
      const validator = new InstallationValidator();

      try {
        const results = await validator.validate(options);

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        }

        // Exit with appropriate code
        const exitCode = results.overall === "pass"
          ? 0
          : results.overall === "warning"
          ? 1
          : 2;
        process.exit(exitCode);
      } catch (error) {
        console.error(chalk.red(`Validation failed: ${error.message}`));
        process.exit(3);
      }
    });

  program.parse();
}

export default InstallationValidator;
