/**
 * Deno version management and validation utilities
 * Ensures consistent Deno version requirements across the project
 */

import { dirname, ensureDir, join, Logger, ValidationError } from "deps";

// Simple semver comparison utilities for Deno
class SemVer {
  static parse(version: string): { major: number; minor: number; patch: number } {
    const cleaned = version.replace(/^v/, "");
    const parts = cleaned.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  static satisfies(version: string, range: string): boolean {
    const v = this.parse(version);

    if (range.startsWith(">=")) {
      const required = this.parse(range.slice(2));
      return v.major > required.major ||
        (v.major === required.major && v.minor > required.minor) ||
        (v.major === required.major && v.minor === required.minor && v.patch >= required.patch);
    }

    return version === range;
  }

  static major(version: string): number {
    return this.parse(version).major;
  }

  static minor(version: string): number {
    return this.parse(version).minor;
  }

  static patch(version: string): number {
    return this.parse(version).patch;
  }
}

interface VersionInfo {
  current: string;
  required: string;
  recommended: string;
  compatible: boolean;
  major: number;
  minor: number;
  patch: number;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  recommendations: string[];
}

class DenoVersionManager {
  private logger: Logger;
  private requiredVersion: string;
  private recommendedVersion: string;

  constructor() {
    this.logger = new Logger();
    this.requiredVersion = ">=1.40.0";
    this.recommendedVersion = "1.40.0";
  }

  // Get current Deno version
  getCurrentVersion(): string {
    return Deno.version.deno;
  }

  // Check if current version meets requirements
  isVersionCompatible(version: string | null = null): boolean {
    const currentVersion = version || this.getCurrentVersion();
    return SemVer.satisfies(currentVersion, this.requiredVersion);
  }

  // Get detailed version information
  getVersionInfo(): VersionInfo {
    const current = this.getCurrentVersion();
    const compatible = this.isVersionCompatible(current);

    return {
      current,
      required: this.requiredVersion,
      recommended: this.recommendedVersion,
      compatible,
      major: SemVer.major(current),
      minor: SemVer.minor(current),
      patch: SemVer.patch(current),
    };
  }

  // Validate Deno version with detailed reporting
  validateVersion(): ValidationResult {
    const info = this.getVersionInfo();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!info.compatible) {
      issues.push(
        `Deno version ${info.current} does not meet requirement ${info.required}`,
      );
      recommendations.push(
        `Please upgrade to Deno ${info.recommended} or later`,
      );
    }

    if (info.current !== info.recommended) {
      recommendations.push(
        `Consider upgrading to recommended version ${info.recommended}`,
      );
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // Get problematic versions (versions with known issues)
  getProblematicVersions(): string[] {
    return [
      "1.0.0", // Initial release, many stability issues
      "1.1.0", // Known import map issues
      "1.2.0", // TypeScript compilation problems
    ];
  }

  // Update deno.json with version requirements
  async updateDenoJson(denoJsonPath: string, version: string | null = null): Promise<void> {
    const targetVersion = version || this.recommendedVersion;

    try {
      let config: Record<string, unknown> = {};

      if (await Deno.stat(denoJsonPath)) {
        const content = await Deno.readTextFile(denoJsonPath);
        config = JSON.parse(content);
      }

      // Add version constraint
      config.version = `>=${targetVersion}`;

      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(config, null, 2) + "\n",
      );

      this.logger.info(`Updated ${denoJsonPath} with Deno version ${targetVersion}`);
    } catch (error) {
      throw new ValidationError(
        `Failed to update ${denoJsonPath}: ${(error as Error).message}`,
        "DENO_JSON_UPDATE_FAILED",
      );
    }
  }

  // Update all deno.json files in project
  async updateAllDenoJsonFiles(projectRoot: string): Promise<void> {
    const denoJsonFiles = await this.findDenoJsonFiles(projectRoot);

    for (const file of denoJsonFiles) {
      await this.updateDenoJson(file);
    }
  }

  // Find all deno.json files in project
  async findDenoJsonFiles(rootDir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      for await (const entry of Deno.readDir(rootDir)) {
        const fullPath = join(rootDir, entry.name);

        if (entry.isFile && entry.name === "deno.json") {
          files.push(fullPath);
        } else if (entry.isDirectory && !this.shouldSkipDirectory(entry.name)) {
          const subFiles = await this.findDenoJsonFiles(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not read directory ${rootDir}: ${(error as Error).message}`);
    }

    return files;
  }

  // Check if directory should be skipped during search
  shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      "node_modules",
      ".git",
      ".deno",
      "dist",
      "build",
      "coverage",
      ".bmad-cache",
    ];
    return skipDirs.includes(dirName);
  }

  // Generate .denorc file for version pinning
  async generateDenoRc(projectRoot: string, version: string | null = null): Promise<void> {
    const targetVersion = version || this.recommendedVersion;
    const rcPath = join(projectRoot, ".denorc");
    const content = `${targetVersion}\n`;

    await Deno.writeTextFile(rcPath, content);
    this.logger.info(`Generated .denorc with version ${targetVersion}`);
  }

  // Generate Dockerfile with Deno
  async generateDockerfile(projectRoot: string, version: string | null = null): Promise<void> {
    const targetVersion = version || this.recommendedVersion;
    const dockerfilePath = join(projectRoot, "Dockerfile");

    const content = `# Deno ${targetVersion}
FROM denoland/deno:${targetVersion}

WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock* import_map.json* ./

# Cache dependencies
RUN deno cache --reload deno.json

# Copy source code
COPY . .

# Run the application
CMD ["deno", "run", "--allow-all", "main.ts"]
`;

    await Deno.writeTextFile(dockerfilePath, content);
    this.logger.info(`Generated Dockerfile with Deno ${targetVersion}`);
  }

  // Generate GitHub Actions workflow
  async generateGitHubWorkflow(
    projectRoot: string,
    versions: string[] | null = null,
  ): Promise<void> {
    const testVersions = versions || [this.recommendedVersion, "1.39.0", "1.40.0"];
    const workflowPath = join(projectRoot, ".github", "workflows", "deno.yml");

    await ensureDir(dirname(workflowPath));

    const content = `name: Deno CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        deno-version: [${testVersions.map((v) => `'${v}'`).join(", ")}]
    
    steps:
    - uses: actions/checkout@v5
    
    - name: Setup Deno
      uses: denoland/setup-deno@v1
      with:
        deno-version: \${{ matrix.deno-version }}
    
    - name: Verify Deno installation
      run: deno --version
    
    - name: Cache dependencies
      run: deno cache --reload deno.json
    
    - name: Run linter
      run: deno lint
    
    - name: Run formatter check
      run: deno fmt --check
    
    - name: Run tests
      run: deno test --allow-all
    
    - name: Type check
      run: deno check **/*.ts
`;

    await Deno.writeTextFile(workflowPath, content);
    this.logger.info(`Generated GitHub workflow for Deno versions: ${testVersions.join(", ")}`);
  }

  // Generate comprehensive version report
  async generateVersionReport(projectRoot: string): Promise<Record<string, unknown>> {
    const denoValidation = this.validateVersion();
    const denoJsonFiles = await this.findDenoJsonFiles(projectRoot);

    const report = {
      timestamp: new Date().toISOString(),
      deno: {
        validation: denoValidation,
        version_info: this.getVersionInfo(),
        problematic_versions: this.getProblematicVersions(),
      },
      project: {
        root: projectRoot,
        deno_json_files: denoJsonFiles,
      },
      recommendations: this.generateRecommendations(denoValidation),
    };

    const reportPath = join(projectRoot, "deno-version-report.json");
    await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  // Generate recommendations based on validation results
  generateRecommendations(denoValidation: ValidationResult): string[] {
    const recommendations: string[] = [];

    if (!denoValidation.valid) {
      recommendations.push("Upgrade Deno to meet version requirements");
      recommendations.push("Run: curl -fsSL https://deno.land/install.sh | sh");
    }

    recommendations.push("Consider using .denorc for version pinning");
    recommendations.push("Set up GitHub Actions for CI/CD with multiple Deno versions");
    recommendations.push("Use deno.json for project configuration");

    return recommendations;
  }
}

export default DenoVersionManager;
