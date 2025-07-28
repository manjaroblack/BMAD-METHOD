/**
 * Installation validation and incremental update utilities
 * Provides comprehensive validation checks and optimized update processes
 */

import process from "node:process";
import fs from "fs-extra";
import path from "node:path";
import crypto from "node:crypto";
import { ValidationError, Logger } from "../../lib/error-handler.js";
import { PerformanceMonitor, ParallelProcessor } from "../../lib/performance-optimizer.js";

class InstallerValidator {
  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.processor = new ParallelProcessor();
  }

  // Validate installation prerequisites
  async validatePrerequisites() {
    this.monitor.startTimer("validate_prerequisites");
    const issues = [];

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const requiredVersion = "20.0.0";
      if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
        issues.push({
          type: "error",
          message:
            `Node.js version ${nodeVersion} is not compatible. Required: >= ${requiredVersion}`,
        });
      }

      // Check available disk space
      const requiredSpace = 100 * 1024 * 1024; // 100MB
      const availableSpace = await this.getAvailableDiskSpace();
      if (availableSpace < requiredSpace) {
        issues.push({
          type: "error",
          message: `Insufficient disk space. Required: ${
            this.formatBytes(requiredSpace)
          }, Available: ${this.formatBytes(availableSpace)}`,
        });
      }

      // Check write permissions
      const testDir = path.join(process.cwd(), ".bmad-test-" + Date.now());
      try {
        await fs.ensureDir(testDir);
        await fs.writeFile(path.join(testDir, "test.txt"), "test");
        await fs.remove(testDir);
      } catch (error) {
        issues.push({
          type: "error",
          message:
            `Write permission denied in current directory: ${error.message}`,
        });
      }

      // Check for conflicting installations
      const conflicts = await this.detectConflictingInstallations();
      conflicts.forEach((conflict) => {
        issues.push({
          type: "warning",
          message: `Conflicting installation detected: ${conflict}`,
        });
      });
    } catch (error) {
      issues.push({
        type: "error",
        message: `Prerequisites validation failed: ${error.message}`,
      });
    }

    this.monitor.endTimer("validate_prerequisites");
    return issues;
  }

  // Validate installation integrity
  async validateInstallation(installDir) {
    this.monitor.startTimer("validate_installation");
    const issues = [];

    try {
      // Check if installation directory exists
      if (!await fs.pathExists(installDir)) {
        throw new ValidationError(
          `Installation directory not found: ${installDir}`,
        );
      }

      // Load and validate manifest
      const manifestPath = path.join(installDir, ".bmad-manifest.json");
      if (!await fs.pathExists(manifestPath)) {
        issues.push({
          type: "error",
          message: "Installation manifest not found",
        });
        return issues;
      }

      const manifest = await fs.readJson(manifestPath);

      // Validate core files
      const coreValidation = await this.validateCoreFiles(installDir, manifest);
      issues.push(...coreValidation);

      // Validate expansion packs
      const expansionValidation = await this.validateExpansionPacks(
        installDir,
        manifest,
      );
      issues.push(...expansionValidation);

      // Validate configuration files
      const configValidation = await this.validateConfiguration(installDir);
      issues.push(...configValidation);

      // Check for orphaned files
      const orphanedFiles = await this.detectOrphanedFiles(
        installDir,
        manifest,
      );
      orphanedFiles.forEach((file) => {
        issues.push({
          type: "warning",
          message: `Orphaned file detected: ${file}`,
        });
      });
    } catch (error) {
      issues.push({
        type: "error",
        message: `Installation validation failed: ${error.message}`,
      });
    }

    this.monitor.endTimer("validate_installation");
    return issues;
  }

  // Validate core files integrity
  async validateCoreFiles(installDir, manifest) {
    const issues = [];
    const coreDir = path.join(installDir, ".bmad-core");

    if (!await fs.pathExists(coreDir)) {
      issues.push({
        type: "error",
        message: "Core installation directory not found",
      });
      return issues;
    }

    // Check required core files
    const requiredFiles = [
      "agents",
      "templates",
      "workflows",
      "core-config.yaml",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(coreDir, file);
      if (!await fs.pathExists(filePath)) {
        issues.push({
          type: "error",
          message: `Required core file missing: ${file}`,
        });
      }
    }

    // Validate file checksums if available
    if (manifest.core && manifest.core.checksums) {
      const checksumValidation = await this.validateChecksums(
        coreDir,
        manifest.core.checksums,
      );
      issues.push(...checksumValidation);
    }

    return issues;
  }

  // Validate expansion packs
  async validateExpansionPacks(installDir, manifest) {
    const issues = [];

    if (!manifest.expansionPacks) {
      return issues;
    }

    for (
      const [packName, packInfo] of Object.entries(manifest.expansionPacks)
    ) {
      const packDir = path.join(installDir, `.${packName}`);

      if (!await fs.pathExists(packDir)) {
        issues.push({
          type: "error",
          message: `Expansion pack directory not found: ${packName}`,
        });
        continue;
      }

      // Validate pack configuration
      const configPath = path.join(packDir, "config.yaml");
      if (!await fs.pathExists(configPath)) {
        issues.push({
          type: "warning",
          message: `Expansion pack config missing: ${packName}`,
        });
      }

      // Validate pack checksums
      if (packInfo.checksums) {
        const checksumValidation = await this.validateChecksums(
          packDir,
          packInfo.checksums,
        );
        issues.push(...checksumValidation);
      }
    }

    return issues;
  }

  // Validate configuration files
  async validateConfiguration(installDir) {
    const issues = [];

    // Check core configuration
    const coreConfigPath = path.join(
      installDir,
      ".bmad-core",
      "core-config.yaml",
    );
    if (await fs.pathExists(coreConfigPath)) {
      try {
        const yaml = require("js-yaml");
        const content = await fs.readFile(coreConfigPath, "utf8");
        yaml.load(content);
      } catch (error) {
        issues.push({
          type: "error",
          message: `Invalid core configuration: ${error.message}`,
        });
      }
    }

    return issues;
  }

  // Validate file checksums
  async validateChecksums(baseDir, checksums) {
    const issues = [];

    const validateFile = async (filePath) => {
      const relativePath = path.relative(baseDir, filePath);
      const expectedChecksum = checksums[relativePath];

      if (!expectedChecksum) {
        return null;
      }

      try {
        const content = await fs.readFile(filePath);
        const actualChecksum = crypto.createHash("sha256").update(content)
          .digest("hex");

        if (actualChecksum !== expectedChecksum) {
          return {
            type: "error",
            message: `Checksum mismatch for ${relativePath}`,
          };
        }
      } catch (error) {
        return {
          type: "error",
          message:
            `Failed to validate checksum for ${relativePath}: ${error.message}`,
        };
      }

      return null;
    };

    // Get all files to validate
    const filesToValidate = Object.keys(checksums).map((relativePath) =>
      path.join(baseDir, relativePath)
    );

    // Validate in parallel
    const results = await this.processor.processInParallel(
      filesToValidate,
      validateFile,
    );

    // Collect issues
    results.forEach((result) => {
      if (result) {
        issues.push(result);
      }
    });

    return issues;
  }

  // Detect orphaned files
  async detectOrphanedFiles(installDir, manifest) {
    const orphanedFiles = [];

    // Get all installed files
    const installedFiles = await this.getAllInstalledFiles(installDir);

    // Get expected files from manifest
    const expectedFiles = new Set();

    // Add core files
    if (manifest.core && manifest.core.files) {
      manifest.core.files.forEach((file) => expectedFiles.add(file));
    }

    // Add expansion pack files
    if (manifest.expansionPacks) {
      Object.values(manifest.expansionPacks).forEach((pack) => {
        if (pack.files) {
          pack.files.forEach((file) => expectedFiles.add(file));
        }
      });
    }

    // Find orphaned files
    installedFiles.forEach((file) => {
      if (!expectedFiles.has(file) && !this.isSystemFile(file)) {
        orphanedFiles.push(file);
      }
    });

    return orphanedFiles;
  }

  // Get all installed files
  async getAllInstalledFiles(installDir) {
    const files = [];

    const walkDir = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(installDir, fullPath);

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          files.push(relativePath);
        }
      }
    };

    await walkDir(installDir);
    return files;
  }

  // Check if file is a system file that should be ignored
  isSystemFile(filePath) {
    const systemFiles = [
      ".bmad-manifest.json",
      ".DS_Store",
      "Thumbs.db",
      ".gitkeep",
    ];

    const fileName = path.basename(filePath);
    return systemFiles.includes(fileName) || fileName.startsWith(".");
  }

  // Detect conflicting installations
  async detectConflictingInstallations() {
    const conflicts = [];

    // Check for global bmad installations
    try {
      const { execSync } = require("child_process");
      const globalPath = execSync("npm list -g bmad-method --depth=0", {
        encoding: "utf8",
      });
      if (globalPath.includes("bmad-method")) {
        conflicts.push("Global npm installation detected");
      }
    } catch (_error) {
      // No global installation found
    }

    return conflicts;
  }

  // Check version compatibility
  isVersionCompatible(current, required) {
    const currentParts = current.split(".").map(Number);
    const requiredParts = required.split(".").map(Number);

    for (
      let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++
    ) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true;
  }

  // Get available disk space
  async getAvailableDiskSpace() {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified check - in production you'd use a proper disk space library
      return 1024 * 1024 * 1024; // Return 1GB as default
    } catch (_error) {
      return 0;
    }
  }

  // Format bytes for display
  formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }

  // Generate performance report
  getPerformanceReport() {
    return {
      metrics: this.monitor.getAllMetrics(),
      summary: this.monitor.getAllMetrics(),
    };
  }
}

export default InstallerValidator;
