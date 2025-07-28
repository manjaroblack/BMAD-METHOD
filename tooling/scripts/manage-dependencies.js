#!/usr/bin/env node
/**
 * Dependency management script
 * Comprehensive dependency auditing, updating, and consolidation
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');
const { execSync, spawn } = require('child_process');
const { Logger } = require('../lib/error-handler.js');
const { PerformanceMonitor } = require('../lib/performance-optimizer.js');
const NodeVersionManager = require('../lib/node-version-manager.js');

class DependencyManager {
  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.nodeManager = new NodeVersionManager();
    this.packageFiles = [];
    this.dependencies = new Map();
    this.results = {
      audit: { vulnerabilities: [], outdated: [], duplicates: [] },
      updates: { updated: [], failed: [], skipped: [] },
      consolidation: { moved: [], removed: [], conflicts: [] },
      cleanup: { removed: [], errors: [] }
    };
  }

  // Main dependency management workflow
  async manage(options = {}) {
    const spinner = ora('Starting dependency management...').start();
    this.monitor.startTimer('dependency_management');

    try {
      // Step 1: Discover all package.json files
      spinner.text = 'Discovering package files...';
      await this.discoverPackageFiles(options.projectRoot);

      // Step 2: Audit dependencies
      if (options.audit !== false) {
        spinner.text = 'Auditing dependencies...';
        await this.auditDependencies(options);
      }

      // Step 3: Update dependencies
      if (options.update) {
        spinner.text = 'Updating dependencies...';
        await this.updateDependencies(options);
      }

      // Step 4: Consolidate dependencies
      if (options.consolidate) {
        spinner.text = 'Consolidating dependencies...';
        await this.consolidateDependencies(options);
      }

      // Step 5: Clean up
      if (options.cleanup) {
        spinner.text = 'Cleaning up...';
        await this.cleanupDependencies(options);
      }

      // Step 6: Update Node.js requirements
      if (options.updateNodeRequirements) {
        spinner.text = 'Updating Node.js requirements...';
        await this.updateNodeRequirements(options.projectRoot);
      }

      this.monitor.endTimer('dependency_management');
      spinner.succeed('Dependency management completed');

      // Display results
      this.displayResults(options);
      
      // Generate report if requested
      if (options.report) {
        await this.generateReport(options.projectRoot, options.report);
      }

      return this.results;
    } catch (error) {
      this.monitor.endTimer('dependency_management');
      spinner.fail(`Dependency management failed: ${error.message}`);
      this.logger.error('Dependency management error:', error);
      throw error;
    }
  }

  // Discover all package.json files in the project
  async discoverPackageFiles(projectRoot) {
    const packageFiles = [];
    
    const walk = async (dir, depth = 0) => {
      if (depth > 3) return; // Limit depth to avoid deep node_modules
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isFile() && entry.name === 'package.json') {
            packageFiles.push({
              path: fullPath,
              relativePath: path.relative(projectRoot, fullPath),
              directory: dir
            });
          } else if (entry.isDirectory()) {
            await walk(fullPath, depth + 1);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to read directory ${dir}: ${error.message}`);
      }
    };
    
    await walk(projectRoot);
    this.packageFiles = packageFiles;
    
    this.logger.info(`Found ${packageFiles.length} package.json files`);
    packageFiles.forEach(pkg => {
      this.logger.debug(`  - ${pkg.relativePath}`);
    });
  }

  // Audit all dependencies for security and outdated packages
  async auditDependencies(options) {
    for (const packageFile of this.packageFiles) {
      try {
        // Load package.json
        const packageJson = await fs.readJson(packageFile.path);
        
        // Security audit
        const vulnerabilities = await this.runSecurityAudit(packageFile.directory);
        if (vulnerabilities.length > 0) {
          this.results.audit.vulnerabilities.push({
            package: packageFile.relativePath,
            vulnerabilities
          });
        }
        
        // Check for outdated packages
        const outdated = await this.checkOutdatedPackages(packageFile.directory);
        if (Object.keys(outdated).length > 0) {
          this.results.audit.outdated.push({
            package: packageFile.relativePath,
            outdated
          });
        }
        
        // Store dependencies for duplicate analysis
        this.storeDependencies(packageFile, packageJson);
        
      } catch (error) {
        this.logger.error(`Failed to audit ${packageFile.relativePath}: ${error.message}`);
      }
    }
    
    // Find duplicate dependencies
    this.findDuplicateDependencies();
  }

  // Store dependencies for analysis
  storeDependencies(packageFile, packageJson) {
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {},
      ...packageJson.optionalDependencies || {}
    };
    
    Object.entries(allDeps).forEach(([name, version]) => {
      if (!this.dependencies.has(name)) {
        this.dependencies.set(name, []);
      }
      
      this.dependencies.get(name).push({
        package: packageFile.relativePath,
        version,
        type: this.getDependencyType(packageJson, name)
      });
    });
  }

  // Get dependency type
  getDependencyType(packageJson, depName) {
    if (packageJson.dependencies && packageJson.dependencies[depName]) return 'dependencies';
    if (packageJson.devDependencies && packageJson.devDependencies[depName]) return 'devDependencies';
    if (packageJson.peerDependencies && packageJson.peerDependencies[depName]) return 'peerDependencies';
    if (packageJson.optionalDependencies && packageJson.optionalDependencies[depName]) return 'optionalDependencies';
    return 'unknown';
  }

  // Find duplicate dependencies across packages
  findDuplicateDependencies() {
    this.dependencies.forEach((usages, depName) => {
      if (usages.length > 1) {
        const versions = [...new Set(usages.map(u => u.version))];
        if (versions.length > 1) {
          this.results.audit.duplicates.push({
            name: depName,
            versions,
            usages
          });
        }
      }
    });
  }

  // Run security audit
  async runSecurityAudit(directory) {
    try {
      const result = execSync('npm audit --json', {
        cwd: directory,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const audit = JSON.parse(result);
      return this.parseVulnerabilities(audit);
    } catch (error) {
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          return this.parseVulnerabilities(audit);
        } catch (parseError) {
          this.logger.warn(`Failed to parse audit results for ${directory}`);
          return [];
        }
      }
      return [];
    }
  }

  // Parse vulnerabilities from audit result
  parseVulnerabilities(audit) {
    const vulnerabilities = [];
    
    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
        vulnerabilities.push({
          name,
          severity: vuln.severity,
          range: vuln.range,
          fixAvailable: vuln.fixAvailable,
          via: vuln.via
        });
      });
    }
    
    return vulnerabilities;
  }

  // Check for outdated packages
  async checkOutdatedPackages(directory) {
    try {
      const result = execSync('npm outdated --json', {
        cwd: directory,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return JSON.parse(result || '{}');
    } catch (error) {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          return {};
        }
      }
      return {};
    }
  }

  // Update dependencies
  async updateDependencies(options) {
    for (const packageFile of this.packageFiles) {
      try {
        const packageJson = await fs.readJson(packageFile.path);
        let updated = false;
        
        // Update using MCP Package Version tool if available
        if (packageJson.dependencies) {
          const updateResult = await this.updatePackageVersions(
            packageJson.dependencies,
            'dependencies',
            packageFile
          );
          if (updateResult.updated) {
            packageJson.dependencies = updateResult.dependencies;
            updated = true;
          }
        }
        
        if (packageJson.devDependencies) {
          const updateResult = await this.updatePackageVersions(
            packageJson.devDependencies,
            'devDependencies',
            packageFile
          );
          if (updateResult.updated) {
            packageJson.devDependencies = updateResult.dependencies;
            updated = true;
          }
        }
        
        // Save updated package.json
        if (updated) {
          await fs.writeJson(packageFile.path, packageJson, { spaces: 2 });
          this.results.updates.updated.push(packageFile.relativePath);
          
          // Install updated dependencies if requested
          if (options.install) {
            await this.installDependencies(packageFile.directory);
          }
        }
        
      } catch (error) {
        this.logger.error(`Failed to update ${packageFile.relativePath}: ${error.message}`);
        this.results.updates.failed.push({
          package: packageFile.relativePath,
          error: error.message
        });
      }
    }
  }

  // Update package versions using latest available
  async updatePackageVersions(dependencies, type, packageFile) {
    try {
      // This would use the MCP Package Version tool
      // For now, we'll simulate the update logic
      const updatedDeps = { ...dependencies };
      let hasUpdates = false;
      
      // Check each dependency for updates
      for (const [name, currentVersion] of Object.entries(dependencies)) {
        const latestVersion = await this.getLatestVersion(name);
        if (latestVersion && latestVersion !== currentVersion) {
          updatedDeps[name] = latestVersion;
          hasUpdates = true;
          this.logger.info(`Updated ${name}: ${currentVersion} → ${latestVersion}`);
        }
      }
      
      return {
        updated: hasUpdates,
        dependencies: updatedDeps
      };
    } catch (error) {
      this.logger.error(`Failed to update ${type} in ${packageFile.relativePath}: ${error.message}`);
      return {
        updated: false,
        dependencies
      };
    }
  }

  // Get latest version of a package
  async getLatestVersion(packageName) {
    try {
      const result = execSync(`npm view ${packageName} version`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return `^${result.trim()}`;
    } catch (error) {
      return null;
    }
  }

  // Install dependencies
  async installDependencies(directory) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: directory,
        stdio: 'pipe'
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      npm.on('error', reject);
    });
  }

  // Consolidate dependencies across packages
  async consolidateDependencies(options) {
    const mainPackageFile = this.packageFiles.find(pkg => 
      pkg.relativePath === 'package.json'
    );
    
    if (!mainPackageFile) {
      this.logger.warn('No main package.json found, skipping consolidation');
      return;
    }
    
    const mainPackageJson = await fs.readJson(mainPackageFile.path);
    
    // Find dependencies that can be moved to main package
    for (const duplicate of this.results.audit.duplicates) {
      try {
        const consolidationResult = await this.consolidateDependency(
          duplicate,
          mainPackageJson,
          mainPackageFile
        );
        
        if (consolidationResult.success) {
          this.results.consolidation.moved.push(consolidationResult);
        } else {
          this.results.consolidation.conflicts.push(consolidationResult);
        }
      } catch (error) {
        this.logger.error(`Failed to consolidate ${duplicate.name}: ${error.message}`);
      }
    }
    
    // Save updated main package.json
    await fs.writeJson(mainPackageFile.path, mainPackageJson, { spaces: 2 });
  }

  // Consolidate a single dependency
  async consolidateDependency(duplicate, mainPackageJson, mainPackageFile) {
    const { name, versions, usages } = duplicate;
    
    // Determine the best version to use
    const targetVersion = this.selectBestVersion(versions);
    
    // Check if it's safe to consolidate
    const canConsolidate = this.canSafelyConsolidate(usages, targetVersion);
    
    if (!canConsolidate) {
      return {
        success: false,
        dependency: name,
        reason: 'Version conflicts prevent safe consolidation',
        versions,
        usages
      };
    }
    
    // Add to main package.json
    if (!mainPackageJson.dependencies) {
      mainPackageJson.dependencies = {};
    }
    mainPackageJson.dependencies[name] = targetVersion;
    
    // Remove from other packages
    for (const usage of usages) {
      if (usage.package !== 'package.json') {
        await this.removeDependencyFromPackage(name, usage.package);
      }
    }
    
    return {
      success: true,
      dependency: name,
      targetVersion,
      movedFrom: usages.filter(u => u.package !== 'package.json').map(u => u.package)
    };
  }

  // Select the best version from multiple versions
  selectBestVersion(versions) {
    // Simple heuristic: use the highest version
    // In a real implementation, you'd use semver comparison
    return versions.sort().pop();
  }

  // Check if dependency can be safely consolidated
  canSafelyConsolidate(usages, targetVersion) {
    // Check if all usages are compatible with target version
    // This is a simplified check - real implementation would use semver
    return usages.every(usage => {
      // Don't consolidate peer dependencies
      if (usage.type === 'peerDependencies') return false;
      
      // Check version compatibility
      return this.isVersionCompatible(usage.version, targetVersion);
    });
  }

  // Check version compatibility
  isVersionCompatible(currentVersion, targetVersion) {
    // Simplified compatibility check
    // Real implementation would use semver.satisfies
    const currentMajor = this.extractMajorVersion(currentVersion);
    const targetMajor = this.extractMajorVersion(targetVersion);
    
    return currentMajor === targetMajor;
  }

  // Extract major version number
  extractMajorVersion(version) {
    const match = version.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  // Remove dependency from a package
  async removeDependencyFromPackage(depName, packagePath) {
    try {
      const fullPath = path.resolve(packagePath);
      const packageJson = await fs.readJson(fullPath);
      
      let removed = false;
      ['dependencies', 'devDependencies', 'optionalDependencies'].forEach(depType => {
        if (packageJson[depType] && packageJson[depType][depName]) {
          delete packageJson[depType][depName];
          removed = true;
        }
      });
      
      if (removed) {
        await fs.writeJson(fullPath, packageJson, { spaces: 2 });
        this.results.consolidation.removed.push({
          dependency: depName,
          from: packagePath
        });
      }
    } catch (error) {
      this.logger.error(`Failed to remove ${depName} from ${packagePath}: ${error.message}`);
    }
  }

  // Clean up dependencies
  async cleanupDependencies(options) {
    for (const packageFile of this.packageFiles) {
      try {
        // Clean node_modules if requested
        if (options.cleanNodeModules) {
          const nodeModulesPath = path.join(packageFile.directory, 'node_modules');
          if (await fs.pathExists(nodeModulesPath)) {
            await fs.remove(nodeModulesPath);
            this.results.cleanup.removed.push(`${packageFile.relativePath}/node_modules`);
          }
        }
        
        // Clean package-lock.json if requested
        if (options.cleanLockFiles) {
          const lockFilePath = path.join(packageFile.directory, 'package-lock.json');
          if (await fs.pathExists(lockFilePath)) {
            await fs.remove(lockFilePath);
            this.results.cleanup.removed.push(`${packageFile.relativePath}/package-lock.json`);
          }
        }
        
      } catch (error) {
        this.logger.error(`Failed to cleanup ${packageFile.relativePath}: ${error.message}`);
        this.results.cleanup.errors.push({
          package: packageFile.relativePath,
          error: error.message
        });
      }
    }
  }

  // Update Node.js requirements in all package.json files
  async updateNodeRequirements(projectRoot) {
    const updateResults = await this.nodeManager.updateAllPackageJsonEngines(projectRoot);
    
    updateResults.forEach(result => {
      if (result.success) {
        this.logger.info(`Updated Node.js engines in ${result.file}`);
      } else {
        this.logger.error(`Failed to update Node.js engines in ${result.file}: ${result.error}`);
      }
    });
    
    // Generate .nvmrc file
    const nvmrcPath = path.join(projectRoot, '.nvmrc');
    await this.nodeManager.generateNvmrc(nvmrcPath);
    this.logger.info('Generated .nvmrc file');
  }

  // Display results
  displayResults(options) {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold('DEPENDENCY MANAGEMENT REPORT'));
    console.log('='.repeat(60));
    
    // Package files discovered
    console.log(`\n📦 Package Files: ${this.packageFiles.length}`);
    if (options.verbose) {
      this.packageFiles.forEach(pkg => {
        console.log(`  • ${pkg.relativePath}`);
      });
    }
    
    // Audit results
    console.log('\n🔍 AUDIT RESULTS:');
    console.log(`  • Vulnerabilities: ${this.results.audit.vulnerabilities.length}`);
    console.log(`  • Outdated packages: ${this.results.audit.outdated.length}`);
    console.log(`  • Duplicate dependencies: ${this.results.audit.duplicates.length}`);
    
    if (this.results.audit.vulnerabilities.length > 0) {
      console.log(chalk.red('\n🚨 Security Vulnerabilities:'));
      this.results.audit.vulnerabilities.forEach(vuln => {
        console.log(chalk.red(`  • ${vuln.package}: ${vuln.vulnerabilities.length} vulnerabilities`));
        if (options.verbose) {
          vuln.vulnerabilities.forEach(v => {
            console.log(chalk.red(`    - ${v.name} (${v.severity})`));
          });
        }
      });
    }
    
    if (this.results.audit.duplicates.length > 0) {
      console.log(chalk.yellow('\n⚠️  Duplicate Dependencies:'));
      this.results.audit.duplicates.slice(0, 5).forEach(dup => {
        console.log(chalk.yellow(`  • ${dup.name}: ${dup.versions.join(', ')}`));
      });
      if (this.results.audit.duplicates.length > 5) {
        console.log(chalk.yellow(`  ... and ${this.results.audit.duplicates.length - 5} more`));
      }
    }
    
    // Update results
    if (this.results.updates.updated.length > 0 || this.results.updates.failed.length > 0) {
      console.log('\n🔄 UPDATE RESULTS:');
      console.log(`  • Updated: ${this.results.updates.updated.length}`);
      console.log(`  • Failed: ${this.results.updates.failed.length}`);
      
      if (options.verbose && this.results.updates.updated.length > 0) {
        console.log(chalk.green('\n✅ Updated packages:'));
        this.results.updates.updated.forEach(pkg => {
          console.log(chalk.green(`  • ${pkg}`));
        });
      }
    }
    
    // Consolidation results
    if (this.results.consolidation.moved.length > 0 || this.results.consolidation.conflicts.length > 0) {
      console.log('\n🔗 CONSOLIDATION RESULTS:');
      console.log(`  • Dependencies moved: ${this.results.consolidation.moved.length}`);
      console.log(`  • Conflicts: ${this.results.consolidation.conflicts.length}`);
    }
    
    // Cleanup results
    if (this.results.cleanup.removed.length > 0) {
      console.log('\n🧹 CLEANUP RESULTS:');
      console.log(`  • Items removed: ${this.results.cleanup.removed.length}`);
      if (options.verbose) {
        this.results.cleanup.removed.forEach(item => {
          console.log(`  • ${item}`);
        });
      }
    }
    
    // Performance info
    const managementTime = this.monitor.getTimer('dependency_management');
    console.log(`\n⏱️  Management completed in ${managementTime}ms`);
  }

  // Generate detailed report
  async generateReport(projectRoot, reportPath) {
    const report = {
      timestamp: new Date().toISOString(),
      packageFiles: this.packageFiles,
      results: this.results,
      dependencies: Object.fromEntries(this.dependencies),
      performance: {
        managementTime: this.monitor.getTimer('dependency_management'),
        metrics: this.monitor.getAllMetrics()
      },
      environment: {
        nodeVersion: this.nodeManager.getVersionInfo(),
        platform: process.platform,
        arch: process.arch
      }
    };
    
    const fullReportPath = path.resolve(projectRoot || process.cwd(), reportPath);
    await fs.writeJson(fullReportPath, report, { spaces: 2 });
    
    console.log(`\n📄 Detailed report saved to: ${fullReportPath}`);
  }
}

// CLI interface
if (require.main === module) {
  program
    .name('manage-dependencies')
    .description('Comprehensive dependency management for BMAD project')
    .option('-p, --project-root <path>', 'Project root directory', process.cwd())
    .option('--audit', 'Audit dependencies for security and outdated packages', true)
    .option('--no-audit', 'Skip dependency audit')
    .option('--update', 'Update dependencies to latest versions')
    .option('--install', 'Install dependencies after updating')
    .option('--consolidate', 'Consolidate duplicate dependencies')
    .option('--cleanup', 'Clean up node_modules and lock files')
    .option('--clean-node-modules', 'Remove all node_modules directories')
    .option('--clean-lock-files', 'Remove all package-lock.json files')
    .option('--update-node-requirements', 'Update Node.js engine requirements')
    .option('-r, --report <path>', 'Generate detailed report file')
    .option('-v, --verbose', 'Show detailed output')
    .option('--json', 'Output results as JSON')
    .action(async (options) => {
      const manager = new DependencyManager();
      
      if (options.verbose) {
        manager.logger.setLevel('debug');
      }
      
      try {
        const results = await manager.manage(options);
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        }
        
        // Exit with appropriate code based on results
        const hasErrors = results.updates.failed.length > 0 || 
                         results.cleanup.errors.length > 0 ||
                         results.audit.vulnerabilities.length > 0;
        
        process.exit(hasErrors ? 1 : 0);
        
      } catch (error) {
        console.error(chalk.red(`Dependency management failed: ${error.message}`));
        process.exit(2);
      }
    });

  program.parse();
}

module.exports = DependencyManager;