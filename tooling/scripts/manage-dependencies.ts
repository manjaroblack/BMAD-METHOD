#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * Dependency management script for Deno
 * Comprehensive dependency auditing, updating, and consolidation
 */

import {
  basename,
  Command,
  DenoVersionManager,
  dirname,
  exists,
  join,
  Logger,
  PerformanceMonitor,
  walk,
} from "deps";

interface DependencyInfo {
  name: string;
  version: string;
  type: "dependencies" | "devDependencies" | "imports";
  file: string;
}

interface AuditResults {
  vulnerabilities: string[];
  outdated: string[];
  duplicates: DependencyInfo[];
}

interface UpdateResults {
  updated: string[];
  failed: string[];
  skipped: string[];
}

interface ConsolidationResults {
  moved: string[];
  removed: string[];
  conflicts: string[];
}

interface CleanupResults {
  removed: string[];
  errors: string[];
}

interface ManagementResults {
  audit: AuditResults;
  updates: UpdateResults;
  consolidation: ConsolidationResults;
  cleanup: CleanupResults;
}

interface ManagementOptions {
  projectRoot?: string;
  audit?: boolean;
  update?: boolean;
  install?: boolean;
  consolidate?: boolean;
  cleanup?: boolean;
  cleanDenoCache?: boolean;
  cleanLockFiles?: boolean;
  updateDenoRequirements?: boolean;
  report?: string;
  verbose?: boolean;
  json?: boolean;
}

class DependencyManager {
  private logger: Logger;
  private monitor: PerformanceMonitor;
  private denoManager: DenoVersionManager;
  private configFiles: string[];
  private dependencies: Map<string, DependencyInfo[]>;
  private results: ManagementResults;

  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.denoManager = new DenoVersionManager();
    this.configFiles = [];
    this.dependencies = new Map();
    this.results = {
      audit: { vulnerabilities: [], outdated: [], duplicates: [] },
      updates: { updated: [], failed: [], skipped: [] },
      consolidation: { moved: [], removed: [], conflicts: [] },
      cleanup: { removed: [], errors: [] },
    };
  }

  // Main dependency management workflow
  async manage(options: ManagementOptions = {}): Promise<ManagementResults> {
    console.log("🔧 Starting Deno dependency management...");
    this.monitor.startTimer("dependency_management");

    try {
      // Step 1: Discover all deno.json and import_map.json files
      console.log("🔍 Discovering configuration files...");
      await this.discoverConfigFiles(options.projectRoot || Deno.cwd());

      // Step 2: Audit dependencies
      if (options.audit !== false) {
        console.log("🔍 Auditing dependencies...");
        await this.auditDependencies(options);
      }

      // Step 3: Update dependencies
      if (options.update) {
        console.log("⬆️ Updating dependencies...");
        await this.updateDependencies(options);
      }

      // Step 4: Consolidate dependencies
      if (options.consolidate) {
        console.log("🔄 Consolidating dependencies...");
        await this.consolidateDependencies(options);
      }

      // Step 5: Cleanup
      if (options.cleanup) {
        console.log("🧹 Cleaning up...");
        await this.cleanupDependencies(options);
      }

      // Step 6: Update Deno requirements
      if (options.updateDenoRequirements) {
        console.log("🔄 Updating Deno requirements...");
        await this.updateDenoRequirements(options.projectRoot || Deno.cwd());
      }

      this.monitor.endTimer("dependency_management");
      console.log("✅ Dependency management completed successfully!");

      if (options.report) {
        await this.generateReport(options.projectRoot || Deno.cwd(), options.report);
      }

      this.displayResults(options);
      return this.results;
    } catch (_error) {
      this.logger.error("Dependency management failed", _error as Error);
      throw _error;
    }
  }

  // Discover all Deno configuration files
  async discoverConfigFiles(projectRoot: string): Promise<void> {
    this.configFiles = [];

    try {
      for await (
        const entry of walk(projectRoot, {
          includeFiles: true,
          includeDirs: false,
          match: [/deno\.json$/, /import_map\.json$/],
        })
      ) {
        if (entry.isFile) {
          this.configFiles.push(entry.path);

          // Load and store dependencies
          const content = await Deno.readTextFile(entry.path);
          const config = JSON.parse(content);
          this.storeDependencies(entry.path, config);
        }
      }

      this.logger.info(`Found ${this.configFiles.length} configuration files`);
    } catch (_error) {
      this.logger.error("Failed to discover configuration files", _error as Error);
    }
  }

  // Audit dependencies for issues
  async auditDependencies(_options: ManagementOptions): Promise<void> {
    try {
      // Check for duplicate dependencies
      this.findDuplicateDependencies();

      // Check for outdated dependencies
      for (const configFile of this.configFiles) {
        await this.checkOutdatedDependencies(dirname(configFile));
      }

      // Security audit (basic check for known vulnerable patterns)
      await this.runSecurityAudit();

      this.logger.info(
        `Audit completed: ${this.results.audit.vulnerabilities.length} vulnerabilities, ${this.results.audit.outdated.length} outdated, ${this.results.audit.duplicates.length} duplicates`,
      );
    } catch (error) {
      this.logger.error("Dependency audit failed", error as Error);
    }
  }

  // Store dependencies from configuration file
  storeDependencies(configFile: string, config: Record<string, unknown>): void {
    const deps: DependencyInfo[] = [];

    // Handle deno.json imports
    if (config.imports) {
      for (const [name, url] of Object.entries(config.imports)) {
        deps.push({
          name,
          version: this.extractVersionFromUrl(url as string),
          type: "imports",
          file: configFile,
        });
      }
    }

    // Handle import_map.json imports
    if (basename(configFile) === "import_map.json" && config.imports) {
      for (const [name, url] of Object.entries(config.imports)) {
        deps.push({
          name,
          version: this.extractVersionFromUrl(url as string),
          type: "imports",
          file: configFile,
        });
      }
    }

    this.dependencies.set(configFile, deps);
  }

  // Extract version from Deno URL
  extractVersionFromUrl(url: string): string {
    const versionMatch = url.match(/@v?([0-9]+\.[0-9]+\.[0-9]+[^/]*)/);
    return versionMatch?.[1] ?? "latest";
  }

  // Find duplicate dependencies across files
  findDuplicateDependencies(): void {
    const depMap = new Map<string, DependencyInfo[]>();

    for (const deps of this.dependencies.values()) {
      for (const dep of deps) {
        if (!depMap.has(dep.name)) {
          depMap.set(dep.name, []);
        }
        const depList = depMap.get(dep.name);
        if (depList) {
          depList.push(dep);
        }
      }
    }

    for (const [_name, deps] of depMap) {
      if (deps.length > 1) {
        this.results.audit.duplicates.push(...deps);
      }
    }
  }

  // Run basic security audit
  runSecurityAudit(): void {
    const vulnerablePatterns = [
      "http://", // Insecure HTTP URLs
      "cdn.jsdelivr.net", // CDN that might have supply chain risks
      "@latest", // Unpinned versions
    ];

    for (const [file, deps] of this.dependencies) {
      for (const dep of deps) {
        for (const pattern of vulnerablePatterns) {
          if (dep.name.includes(pattern) || dep.version.includes(pattern)) {
            this.results.audit.vulnerabilities.push(
              `${dep.name}@${dep.version} in ${file}: ${pattern}`,
            );
          }
        }
      }
    }
  }

  // Check for outdated dependencies
  async checkOutdatedDependencies(directory: string): Promise<void> {
    try {
      // For Deno, we can check if there are newer versions available
      // This is a simplified check - in practice, you'd want to query registries
      const configPath = join(directory, "deno.json");
      if (await exists(configPath)) {
        const content = await Deno.readTextFile(configPath);
        const config = JSON.parse(content);

        if (config.imports) {
          for (const [name, url] of Object.entries(config.imports)) {
            const version = this.extractVersionFromUrl(url as string);
            if (version !== "latest" && this.isOldVersion(version)) {
              this.results.audit.outdated.push(`${name}@${version}`);
            }
          }
        }
      }
    } catch (_error) {
      this.logger.warn(`Could not check outdated dependencies in ${directory}`);
    }
  }

  // Simple check if version seems old (basic heuristic)
  isOldVersion(version: string): boolean {
    const parts = version.split(".");
    const major = parseInt(parts[0] || "0");
    const minor = parseInt(parts[1] || "0");

    // Very basic heuristic - consider versions with major < 1 or very old
    return major === 0 || (major === 1 && minor < 10);
  }

  // Update dependencies to latest versions
  async updateDependencies(options: ManagementOptions): Promise<void> {
    try {
      for (const configFile of this.configFiles) {
        await this.updateConfigFile(configFile, options);
      }

      if (options.install) {
        await this.cacheDependencies();
      }
    } catch (error) {
      this.logger.error("Failed to update dependencies", error as Error);
    }
  }

  // Update a specific configuration file
  async updateConfigFile(configFile: string, _options: ManagementOptions): Promise<void> {
    try {
      const content = await Deno.readTextFile(configFile);
      const config = JSON.parse(content);
      let updated = false;

      if (config.imports) {
        for (const [name, url] of Object.entries(config.imports)) {
          const currentVersion = this.extractVersionFromUrl(url as string);
          const latestVersion = await this.getLatestVersion(name, url as string);

          if (latestVersion && latestVersion !== currentVersion) {
            const newUrl = (url as string).replace(
              /@v?[0-9]+\.[0-9]+\.[0-9]+[^/]*/,
              `@${latestVersion}`,
            );
            config.imports[name] = newUrl;
            updated = true;
            this.results.updates.updated.push(`${name}: ${currentVersion} → ${latestVersion}`);
          }
        }
      }

      if (updated) {
        await Deno.writeTextFile(configFile, JSON.stringify(config, null, 2));
        this.logger.info(`Updated ${configFile}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update ${configFile}`, error as Error);
      this.results.updates.failed.push(configFile);
    }
  }

  // Get latest version for a dependency (simplified)
  getLatestVersion(_name: string, url: string): string | null {
    try {
      // For std library, extract latest from URL pattern
      if (url.includes("deno.land/std@")) {
        // This would need to query the actual Deno registry
        // For now, return a placeholder
        return "0.208.0";
      }

      // For other dependencies, this would need registry queries
      return null;
    } catch {
      return null;
    }
  }

  // Cache dependencies
  async cacheDependencies(): Promise<void> {
    try {
      const command = new Deno.Command("deno", {
        args: ["cache", "--reload", ...this.configFiles],
        stdout: "piped",
        stderr: "piped",
      });

      const { success, stdout: _stdout, stderr } = await command.output();

      if (success) {
        this.logger.info("Dependencies cached successfully");
      } else {
        const error = new TextDecoder().decode(stderr);
        this.logger.error(`Failed to cache dependencies: ${error}`);
      }
    } catch (error) {
      this.logger.error("Failed to cache dependencies", error as Error);
    }
  }

  // Consolidate duplicate dependencies
  async consolidateDependencies(_options: ManagementOptions): Promise<void> {
    try {
      const duplicates = this.results.audit.duplicates;
      const consolidationMap = new Map<string, DependencyInfo[]>();

      // Group duplicates by name
      for (const dep of duplicates) {
        if (!consolidationMap.has(dep.name)) {
          consolidationMap.set(dep.name, []);
        }
        const depList = consolidationMap.get(dep.name);
        if (depList) {
          depList.push(dep);
        }
      }

      // Consolidate each group
      for (const [name, deps] of consolidationMap) {
        await this.consolidateDependency(name, deps);
      }
    } catch (error) {
      this.logger.error("Failed to consolidate dependencies", error as Error);
    }
  }

  // Consolidate a specific dependency
  async consolidateDependency(name: string, deps: DependencyInfo[]): Promise<void> {
    try {
      // Find the best version to use
      const versions = deps.map((d) => d.version);
      const bestVersion = this.selectBestVersion(versions);

      // Update all files to use the best version
      for (const dep of deps) {
        if (dep.version !== bestVersion) {
          await this.updateDependencyVersion(dep.file, name, bestVersion);
          this.results.consolidation.moved.push(
            `${name}@${dep.version} → ${bestVersion} in ${dep.file}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to consolidate ${name}`, error as Error);
      this.results.consolidation.conflicts.push(name);
    }
  }

  // Update dependency version in a file
  async updateDependencyVersion(file: string, name: string, version: string): Promise<void> {
    const content = await Deno.readTextFile(file);
    const config = JSON.parse(content);

    if (config.imports && config.imports[name]) {
      const oldUrl = config.imports[name] as string;
      const newUrl = oldUrl.replace(
        /@v?[0-9]+\.[0-9]+\.[0-9]+[^/]*/,
        `@${version}`,
      );
      config.imports[name] = newUrl;

      await Deno.writeTextFile(file, JSON.stringify(config, null, 2));
    }
  }

  // Select the best version from a list
  selectBestVersion(versions: string[]): string {
    // Simple heuristic: prefer the latest semantic version
    const sorted = versions.sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;

        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }

      return 0;
    });
    return sorted[0] ?? "latest";
  }

  // Cleanup dependencies
  async cleanupDependencies(options: ManagementOptions): Promise<void> {
    try {
      if (options.cleanDenoCache) {
        await this.cleanDenoCache();
      }

      if (options.cleanLockFiles) {
        await this.cleanLockFiles(options.projectRoot || Deno.cwd());
      }
    } catch (error) {
      this.logger.error("Failed to cleanup dependencies", error as Error);
    }
  }

  // Clean Deno cache
  async cleanDenoCache(): Promise<void> {
    try {
      const command = new Deno.Command("deno", {
        args: ["cache", "--reload"],
        stdout: "piped",
        stderr: "piped",
      });

      await command.output();
      this.results.cleanup.removed.push("Deno cache");
      this.logger.info("Cleaned Deno cache");
    } catch (error) {
      this.logger.error("Failed to clean Deno cache", error as Error);
      this.results.cleanup.errors.push("Deno cache cleanup failed");
    }
  }

  // Clean lock files
  async cleanLockFiles(projectRoot: string): Promise<void> {
    try {
      for await (
        const entry of walk(projectRoot, {
          includeFiles: true,
          includeDirs: false,
          match: [/deno\.lock$/],
        })
      ) {
        await Deno.remove(entry.path);
        this.results.cleanup.removed.push(entry.path);
        this.logger.info(`Removed ${entry.path}`);
      }
    } catch (error) {
      this.logger.error("Failed to clean lock files", error as Error);
    }
  }

  // Update Deno requirements
  async updateDenoRequirements(projectRoot: string): Promise<void> {
    try {
      await this.denoManager.updateAllDenoJsonFiles(projectRoot);
      this.logger.info("Updated Deno version requirements");
    } catch (error) {
      this.logger.error("Failed to update Deno requirements", error as Error);
    }
  }

  // Display results
  displayResults(options: ManagementOptions): void {
    if (options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log("\n📊 Dependency Management Results:");

    // Audit results
    console.log("\n🔍 Audit:");
    console.log(`  Vulnerabilities: ${this.results.audit.vulnerabilities.length}`);
    console.log(`  Outdated: ${this.results.audit.outdated.length}`);
    console.log(`  Duplicates: ${this.results.audit.duplicates.length}`);

    if (options.verbose && this.results.audit.vulnerabilities.length > 0) {
      console.log("\n⚠️ Vulnerabilities:");
      this.results.audit.vulnerabilities.forEach((vuln) => console.log(`  - ${vuln}`));
    }

    // Update results
    if (this.results.updates.updated.length > 0) {
      console.log("\n⬆️ Updates:");
      console.log(`  Updated: ${this.results.updates.updated.length}`);
      console.log(`  Failed: ${this.results.updates.failed.length}`);

      if (options.verbose) {
        this.results.updates.updated.forEach((update) => console.log(`  ✅ ${update}`));
      }
    }

    // Consolidation results
    if (this.results.consolidation.moved.length > 0) {
      console.log("\n🔄 Consolidation:");
      console.log(`  Moved: ${this.results.consolidation.moved.length}`);
      console.log(`  Conflicts: ${this.results.consolidation.conflicts.length}`);
    }

    // Cleanup results
    if (this.results.cleanup.removed.length > 0) {
      console.log("\n🧹 Cleanup:");
      console.log(`  Removed: ${this.results.cleanup.removed.length}`);
      console.log(`  Errors: ${this.results.cleanup.errors.length}`);
    }
  }

  // Generate detailed report
  async generateReport(projectRoot: string, reportPath: string): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        project_root: projectRoot,
        deno_version: Deno.version.deno,
        config_files: this.configFiles,
        dependencies: Object.fromEntries(this.dependencies),
        results: this.results,
        performance: this.monitor.getAllMetrics(),
      };

      await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.info(`Report generated: ${reportPath}`);
    } catch (error) {
      this.logger.error("Failed to generate report", error as Error);
    }
  }
}

// CLI setup
const program = new Command()
  .name("manage-dependencies")
  .description("Comprehensive dependency management for Deno projects")
  .option("-p, --project-root <path>", "Project root directory", { default: Deno.cwd() })
  .option("--audit", "Audit dependencies for security and outdated packages", { default: true })
  .option("--no-audit", "Skip dependency audit")
  .option("--update", "Update dependencies to latest versions")
  .option("--install", "Cache dependencies after updating")
  .option("--consolidate", "Consolidate duplicate dependencies")
  .option("--cleanup", "Clean up cache and lock files")
  .option("--clean-deno-cache", "Remove Deno cache")
  .option("--clean-lock-files", "Remove all deno.lock files")
  .option("--update-deno-requirements", "Update Deno version requirements")
  .option("-r, --report <path>", "Generate detailed report file")
  .option("-v, --verbose", "Show detailed output")
  .option("--json", "Output results as JSON")
  .action(async (options) => {
    try {
      const manager = new DependencyManager();
      await manager.manage(options);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

if (import.meta.main) {
  await program.parse(Deno.args);
}

export default DependencyManager;
