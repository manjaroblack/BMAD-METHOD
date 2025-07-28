/**
 * Node.js version management and validation utilities
 * Ensures consistent Node.js version requirements across the project
 */

import process from "node:process";
import fs from "fs-extra";
import path from "node:path";
import semver from "semver";
import { Logger, ValidationError } from "./error-handler.js";

class NodeVersionManager {
  constructor() {
    this.logger = new Logger();
    this.requiredVersion = ">=20.0.0";
    this.recommendedVersion = "20.11.0";
  }

  // Get current Node.js version
  getCurrentVersion() {
    return process.version;
  }

  // Check if current version meets requirements
  isVersionCompatible(version = null) {
    const currentVersion = version || this.getCurrentVersion();
    return semver.satisfies(currentVersion, this.requiredVersion);
  }

  // Get detailed version information
  getVersionInfo() {
    const current = this.getCurrentVersion();
    const compatible = this.isVersionCompatible(current);

    return {
      current,
      required: this.requiredVersion,
      recommended: this.recommendedVersion,
      compatible,
      major: semver.major(current),
      minor: semver.minor(current),
      patch: semver.patch(current),
    };
  }

  // Validate Node.js version with detailed reporting
  validateVersion() {
    const info = this.getVersionInfo();
    const issues = [];

    if (!info.compatible) {
      issues.push({
        type: "error",
        code: "INCOMPATIBLE_NODE_VERSION",
        message:
          `Node.js version ${info.current} is not compatible. Required: ${info.required}`,
        current: info.current,
        required: info.required,
      });
    } else if (semver.lt(info.current, this.recommendedVersion)) {
      issues.push({
        type: "warning",
        code: "OUTDATED_NODE_VERSION",
        message:
          `Node.js version ${info.current} is below recommended version ${this.recommendedVersion}`,
        current: info.current,
        recommended: this.recommendedVersion,
      });
    }

    // Check for known problematic versions
    const problematicVersions = this.getProblematicVersions();
    const currentClean = semver.clean(info.current);

    if (problematicVersions.some((v) => semver.eq(currentClean, v.version))) {
      const problem = problematicVersions.find((v) =>
        semver.eq(currentClean, v.version)
      );
      issues.push({
        type: "warning",
        code: "PROBLEMATIC_NODE_VERSION",
        message:
          `Node.js version ${info.current} has known issues: ${problem.issue}`,
        current: info.current,
        issue: problem.issue,
        recommendation: problem.recommendation,
      });
    }

    return {
      valid: issues.filter((i) => i.type === "error").length === 0,
      issues,
      info,
    };
  }

  // Get list of known problematic Node.js versions
  getProblematicVersions() {
    return [
      {
        version: "20.0.0",
        issue: "Initial release with potential stability issues",
        recommendation: "Upgrade to 20.1.0 or later",
      },
      {
        version: "19.0.0",
        issue: "Experimental features may cause compatibility issues",
        recommendation: "Use LTS version 20.x.x",
      },
    ];
  }

  // Update package.json engines field
  async updatePackageJsonEngines(packageJsonPath, engines = null) {
    try {
      const defaultEngines = {
        node: this.requiredVersion,
        npm: ">=9.0.0",
      };

      const targetEngines = engines || defaultEngines;

      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        packageJson.engines = { ...packageJson.engines, ...targetEngines };
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

        this.logger.info(`Updated engines in ${packageJsonPath}`);
        return true;
      } else {
        this.logger.warn(`Package.json not found at ${packageJsonPath}`);
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to update package.json engines: ${error.message}`,
      );
      throw error;
    }
  }

  // Scan project for package.json files and update engines
  async updateAllPackageJsonEngines(projectRoot) {
    const packageJsonFiles = await this.findPackageJsonFiles(projectRoot);
    const results = [];

    for (const file of packageJsonFiles) {
      try {
        const success = await this.updatePackageJsonEngines(file);
        results.push({ file, success, error: null });
      } catch (error) {
        results.push({ file, success: false, error: error.message });
      }
    }

    return results;
  }

  // Find all package.json files in project
  async findPackageJsonFiles(rootDir) {
    const packageJsonFiles = [];

    const walk = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && entry.name === "package.json") {
            packageJsonFiles.push(fullPath);
          } else if (
            entry.isDirectory() && !this.shouldSkipDirectory(entry.name)
          ) {
            await walk(fullPath);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to read directory ${dir}: ${error.message}`);
      }
    };

    await walk(rootDir);
    return packageJsonFiles;
  }

  // Check if directory should be skipped during scan
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      "node_modules",
      ".git",
      ".svn",
      "dist",
      "build",
      "coverage",
      ".nyc_output",
    ];

    return skipDirs.includes(dirName) || dirName.startsWith(".");
  }

  // Generate .nvmrc file
  async generateNvmrc(projectRoot, version = null) {
    const targetVersion = version || this.recommendedVersion;
    const nvmrcPath = path.join(projectRoot, ".nvmrc");

    try {
      await fs.writeFile(nvmrcPath, targetVersion + "\n");
      this.logger.info(
        `Generated .nvmrc with Node.js version ${targetVersion}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to generate .nvmrc: ${error.message}`);
      throw error;
    }
  }

  // Generate Dockerfile with specific Node.js version
  async generateDockerfile(projectRoot, version = null) {
    const targetVersion = version || this.recommendedVersion;
    const dockerfilePath = path.join(projectRoot, "Dockerfile.node");

    const dockerfileContent = `# Node.js ${targetVersion} Dockerfile
FROM node:${targetVersion}-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
`;

    try {
      await fs.writeFile(dockerfilePath, dockerfileContent);
      this.logger.info(
        `Generated Dockerfile.node with Node.js version ${targetVersion}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to generate Dockerfile: ${error.message}`);
      throw error;
    }
  }

  // Generate GitHub Actions workflow with Node.js matrix
  async generateGitHubWorkflow(projectRoot, versions = null) {
    const targetVersions = versions || ["18.x", "20.x", "21.x"];
    const workflowPath = path.join(
      projectRoot,
      ".github",
      "workflows",
      "node.yml",
    );

    const workflowContent = `name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [${targetVersions.map((v) => `'${v}'`).join(", ")}]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linter
      run: npm run lint
`;

    try {
      await fs.ensureDir(path.dirname(workflowPath));
      await fs.writeFile(workflowPath, workflowContent);
      this.logger.info(
        `Generated GitHub Actions workflow with Node.js versions: ${
          targetVersions.join(", ")
        }`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to generate GitHub workflow: ${error.message}`);
      throw error;
    }
  }

  // Check npm version compatibility
  async checkNpmVersion() {
    try {
      const { execSync } = require("child_process");
      const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
      const requiredNpmVersion = ">=9.0.0";

      const compatible = semver.satisfies(npmVersion, requiredNpmVersion);

      return {
        current: npmVersion,
        required: requiredNpmVersion,
        compatible,
        issues: compatible ? [] : [{
          type: "warning",
          code: "INCOMPATIBLE_NPM_VERSION",
          message:
            `npm version ${npmVersion} may not be compatible. Required: ${requiredNpmVersion}`,
        }],
      };
    } catch (error) {
      return {
        current: "unknown",
        required: ">=9.0.0",
        compatible: false,
        issues: [{
          type: "error",
          code: "NPM_VERSION_CHECK_FAILED",
          message: `Failed to check npm version: ${error.message}`,
        }],
      };
    }
  }

  // Generate comprehensive version report
  async generateVersionReport(projectRoot) {
    const nodeValidation = this.validateVersion();
    const npmCheck = await this.checkNpmVersion();
    const packageJsonFiles = await this.findPackageJsonFiles(projectRoot);

    const packageEngines = [];
    for (const file of packageJsonFiles) {
      try {
        const packageJson = await fs.readJson(file);
        packageEngines.push({
          file: path.relative(projectRoot, file),
          engines: packageJson.engines || {},
          hasEngines: !!packageJson.engines,
        });
      } catch (error) {
        packageEngines.push({
          file: path.relative(projectRoot, file),
          engines: {},
          hasEngines: false,
          error: error.message,
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      node: nodeValidation,
      npm: npmCheck,
      packageFiles: packageEngines,
      recommendations: this.generateRecommendations(
        nodeValidation,
        npmCheck,
        packageEngines,
      ),
    };
  }

  // Generate recommendations based on version report
  generateRecommendations(nodeValidation, npmCheck, packageEngines) {
    const recommendations = [];

    if (!nodeValidation.valid) {
      recommendations.push({
        type: "critical",
        action: "upgrade_node",
        message:
          `Upgrade Node.js to version ${this.recommendedVersion} or later`,
      });
    }

    if (!npmCheck.compatible) {
      recommendations.push({
        type: "warning",
        action: "upgrade_npm",
        message: "Upgrade npm to version 9.0.0 or later",
      });
    }

    const filesWithoutEngines = packageEngines.filter((p) => !p.hasEngines);
    if (filesWithoutEngines.length > 0) {
      recommendations.push({
        type: "improvement",
        action: "add_engines",
        message:
          `Add engines field to ${filesWithoutEngines.length} package.json files`,
        files: filesWithoutEngines.map((f) => f.file),
      });
    }

    return recommendations;
  }
}

export default NodeVersionManager;
