#!/usr/bin/env node
/**
 * Master optimization script
 * Orchestrates all code quality improvements and performance optimizations
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');
const { Logger, BMadError } = require('../lib/error-handler.js');
const { PerformanceMonitor } = require('../lib/performance-optimizer.js');
const NodeVersionManager = require('../lib/node-version-manager.js');

// Import optimization modules
const BuildOptimizer = require('./optimize-build.js');
const InstallationValidator = require('./validate-installation.js');
const DependencyManager = require('./manage-dependencies.js');

class MasterOptimizer {
  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this.nodeManager = new NodeVersionManager();
    this.buildOptimizer = new BuildOptimizer();
    this.validator = new InstallationValidator();
    this.dependencyManager = new DependencyManager();
    
    this.results = {
      validation: null,
      dependencies: null,
      build: null,
      overall: {
        success: false,
        score: 0,
        issues: [],
        recommendations: []
      }
    };
  }

  // Main optimization workflow
  async optimize(options = {}) {
    console.log(chalk.bold.blue('\n🚀 BMAD METHOD - MASTER OPTIMIZATION\n'));
    console.log('='.repeat(60));
    
    const spinner = ora('Initializing master optimization...').start();
    this.monitor.startTimer('master_optimization');

    try {
      // Phase 1: Pre-optimization validation
      spinner.text = 'Phase 1: Pre-optimization validation...';
      await this.preOptimizationValidation(options);
      
      // Phase 2: Dependency management
      if (options.skipDependencies !== true) {
        spinner.text = 'Phase 2: Dependency management...';
        await this.manageDependencies(options);
      }
      
      // Phase 3: Build optimization
      if (options.skipBuild !== true) {
        spinner.text = 'Phase 3: Build optimization...';
        await this.optimizeBuild(options);
      }
      
      // Phase 4: Post-optimization validation
      spinner.text = 'Phase 4: Post-optimization validation...';
      await this.postOptimizationValidation(options);
      
      // Phase 5: Generate comprehensive report
      spinner.text = 'Phase 5: Generating comprehensive report...';
      await this.generateComprehensiveReport(options);
      
      this.monitor.endTimer('master_optimization');
      
      // Calculate overall results
      this.calculateOverallResults();
      
      if (this.results.overall.success) {
        spinner.succeed('Master optimization completed successfully!');
      } else {
        spinner.warn('Master optimization completed with issues');
      }
      
      // Display comprehensive results
      this.displayComprehensiveResults(options);
      
      return this.results;
      
    } catch (error) {
      this.monitor.endTimer('master_optimization');
      spinner.fail(`Master optimization failed: ${error.message}`);
      this.logger.error('Master optimization error:', error);
      throw new BMadError('MASTER_OPTIMIZATION_FAILED', `Master optimization failed: ${error.message}`);
    }
  }

  // Pre-optimization validation
  async preOptimizationValidation(options) {
    this.logger.info('Starting pre-optimization validation...');
    
    try {
      const validationOptions = {
        projectRoot: options.projectRoot,
        verbose: options.verbose
      };
      
      this.results.validation = await this.validator.validate(validationOptions);
      
      // Check if critical issues prevent optimization
      if (this.results.validation.summary.criticalIssues > 0) {
        const criticalIssues = this.getCriticalIssues(this.results.validation);
        
        if (options.force) {
          this.logger.warn('Critical issues found but continuing due to --force flag');
          criticalIssues.forEach(issue => {
            this.logger.warn(`  • ${issue}`);
          });
        } else {
          throw new BMadError('CRITICAL_VALIDATION_ISSUES', 
            `Critical validation issues prevent optimization. Use --force to override.\n${criticalIssues.join('\n')}`);
        }
      }
      
    } catch (error) {
      if (error instanceof BMadError) {
        throw error;
      }
      throw new BMadError('PRE_VALIDATION_FAILED', `Pre-optimization validation failed: ${error.message}`);
    }
  }

  // Manage dependencies
  async manageDependencies(options) {
    this.logger.info('Starting dependency management...');
    
    try {
      const dependencyOptions = {
        projectRoot: options.projectRoot,
        audit: true,
        update: options.updateDependencies,
        install: options.installDependencies,
        consolidate: options.consolidateDependencies,
        cleanup: options.cleanupDependencies,
        updateNodeRequirements: options.updateNodeRequirements,
        verbose: options.verbose
      };
      
      this.results.dependencies = await this.dependencyManager.manage(dependencyOptions);
      
      // Check for security vulnerabilities
      if (this.results.dependencies.audit.vulnerabilities.length > 0) {
        const highSeverityVulns = this.getHighSeverityVulnerabilities(this.results.dependencies);
        
        if (highSeverityVulns.length > 0 && !options.ignoreVulnerabilities) {
          this.logger.warn(`Found ${highSeverityVulns.length} high-severity vulnerabilities`);
          this.results.overall.issues.push({
            type: 'security',
            severity: 'high',
            message: `${highSeverityVulns.length} high-severity security vulnerabilities found`,
            details: highSeverityVulns
          });
        }
      }
      
    } catch (error) {
      throw new BMadError('DEPENDENCY_MANAGEMENT_FAILED', `Dependency management failed: ${error.message}`);
    }
  }

  // Optimize build process
  async optimizeBuild(options) {
    this.logger.info('Starting build optimization...');
    
    try {
      const buildOptions = {
        projectRoot: options.projectRoot,
        sourceDir: options.sourceDir,
        outputDir: options.outputDir,
        dependencies: true,
        build: true,
        verbose: options.verbose
      };
      
      this.results.build = await this.buildOptimizer.optimize(buildOptions);
      
      // Analyze build performance
      if (this.results.build && this.results.build.performance) {
        const buildTime = this.results.build.performance.metrics.full_optimization;
        if (buildTime > 60000) { // > 1 minute
          this.results.overall.issues.push({
            type: 'performance',
            severity: 'medium',
            message: `Build optimization took ${Math.round(buildTime / 1000)}s, consider further optimizations`
          });
        }
      }
      
    } catch (error) {
      throw new BMadError('BUILD_OPTIMIZATION_FAILED', `Build optimization failed: ${error.message}`);
    }
  }

  // Post-optimization validation
  async postOptimizationValidation(options) {
    this.logger.info('Starting post-optimization validation...');
    
    try {
      const validationOptions = {
        projectRoot: options.projectRoot,
        verbose: false // Less verbose for post-validation
      };
      
      const postValidation = await this.validator.validate(validationOptions);
      
      // Compare with pre-optimization results
      if (this.results.validation) {
        const improvement = this.calculateValidationImprovement(
          this.results.validation,
          postValidation
        );
        
        this.results.validation.improvement = improvement;
        this.logger.info(`Validation score improved by ${improvement.scoreImprovement} points`);
      }
      
      // Update validation results with post-optimization data
      this.results.validation.postOptimization = postValidation;
      
    } catch (error) {
      this.logger.warn(`Post-optimization validation failed: ${error.message}`);
      // Don't fail the entire process for post-validation issues
    }
  }

  // Generate comprehensive report
  async generateComprehensiveReport(options) {
    if (!options.report) return;
    
    this.logger.info('Generating comprehensive optimization report...');
    
    try {
      const report = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          projectRoot: options.projectRoot,
          optimizationTime: this.monitor.getTimer('master_optimization')
        },
        environment: {
          nodeVersion: this.nodeManager.getVersionInfo(),
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage()
        },
        results: this.results,
        performance: {
          totalTime: this.monitor.getTimer('master_optimization'),
          phaseBreakdown: this.monitor.getAllMetrics(),
          memoryUsage: process.memoryUsage()
        },
        recommendations: this.generateRecommendations(),
        summary: this.generateExecutiveSummary()
      };
      
      const reportPath = path.resolve(options.projectRoot || process.cwd(), options.report);
      await fs.writeJson(reportPath, report, { spaces: 2 });
      
      // Also generate a markdown summary
      const markdownPath = reportPath.replace(/\.json$/, '.md');
      await this.generateMarkdownReport(report, markdownPath);
      
      this.logger.info(`Comprehensive report saved to: ${reportPath}`);
      this.logger.info(`Markdown summary saved to: ${markdownPath}`);
      
    } catch (error) {
      this.logger.error(`Failed to generate comprehensive report: ${error.message}`);
    }
  }

  // Calculate overall results
  calculateOverallResults() {
    let totalScore = 0;
    let scoreCount = 0;
    
    // Validation score
    if (this.results.validation && this.results.validation.summary) {
      totalScore += this.results.validation.summary.overallScore;
      scoreCount++;
    }
    
    // Dependency score (based on issues found)
    if (this.results.dependencies) {
      const depScore = this.calculateDependencyScore(this.results.dependencies);
      totalScore += depScore;
      scoreCount++;
    }
    
    // Build score (based on performance)
    if (this.results.build) {
      const buildScore = this.calculateBuildScore(this.results.build);
      totalScore += buildScore;
      scoreCount++;
    }
    
    this.results.overall.score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    this.results.overall.success = this.results.overall.score >= 80 && this.results.overall.issues.filter(i => i.severity === 'high').length === 0;
    
    // Generate recommendations
    this.results.overall.recommendations = this.generateRecommendations();
  }

  // Calculate dependency score
  calculateDependencyScore(depResults) {
    let score = 100;
    
    // Deduct for vulnerabilities
    if (depResults.audit.vulnerabilities.length > 0) {
      const highSeverity = this.getHighSeverityVulnerabilities(depResults).length;
      score -= (highSeverity * 20) + (depResults.audit.vulnerabilities.length * 5);
    }
    
    // Deduct for outdated packages
    score -= Math.min(depResults.audit.outdated.length * 2, 20);
    
    // Deduct for duplicates
    score -= Math.min(depResults.audit.duplicates.length * 3, 15);
    
    return Math.max(0, score);
  }

  // Calculate build score
  calculateBuildScore(buildResults) {
    let score = 100;
    
    // Deduct for slow build times
    if (buildResults.performance && buildResults.performance.metrics.full_optimization) {
      const buildTime = buildResults.performance.metrics.full_optimization;
      if (buildTime > 60000) score -= 20; // > 1 minute
      else if (buildTime > 30000) score -= 10; // > 30 seconds
    }
    
    // Add points for optimizations enabled
    if (buildResults.build) {
      if (buildResults.build.cacheEnabled) score += 5;
      if (buildResults.build.parallelProcessing) score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Get critical issues
  getCriticalIssues(validation) {
    const issues = [];
    
    Object.values(validation.categories).forEach(category => {
      category.issues.forEach(issue => {
        if (issue.severity === 'critical') {
          issues.push(issue.message);
        }
      });
    });
    
    return issues;
  }

  // Get high severity vulnerabilities
  getHighSeverityVulnerabilities(depResults) {
    const highSeverity = [];
    
    depResults.audit.vulnerabilities.forEach(vulnGroup => {
      vulnGroup.vulnerabilities.forEach(vuln => {
        if (vuln.severity === 'high' || vuln.severity === 'critical') {
          highSeverity.push(vuln);
        }
      });
    });
    
    return highSeverity;
  }

  // Calculate validation improvement
  calculateValidationImprovement(preValidation, postValidation) {
    return {
      scoreImprovement: postValidation.summary.overallScore - preValidation.summary.overallScore,
      issuesReduced: preValidation.summary.totalIssues - postValidation.summary.totalIssues,
      criticalIssuesReduced: preValidation.summary.criticalIssues - postValidation.summary.criticalIssues
    };
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Validation recommendations
    if (this.results.validation && this.results.validation.summary.overallScore < 90) {
      recommendations.push({
        category: 'validation',
        priority: 'high',
        message: 'Address remaining validation issues to improve overall score',
        action: 'Run validation script with --verbose flag to see detailed issues'
      });
    }
    
    // Dependency recommendations
    if (this.results.dependencies) {
      if (this.results.dependencies.audit.vulnerabilities.length > 0) {
        recommendations.push({
          category: 'security',
          priority: 'critical',
          message: 'Security vulnerabilities found in dependencies',
          action: 'Run npm audit fix or update vulnerable packages'
        });
      }
      
      if (this.results.dependencies.audit.duplicates.length > 5) {
        recommendations.push({
          category: 'dependencies',
          priority: 'medium',
          message: 'Multiple duplicate dependencies found',
          action: 'Consider consolidating dependencies to reduce bundle size'
        });
      }
    }
    
    // Build recommendations
    if (this.results.build && this.results.build.performance) {
      const buildTime = this.results.build.performance.metrics.full_optimization;
      if (buildTime > 30000) {
        recommendations.push({
          category: 'performance',
          priority: 'medium',
          message: 'Build process is slow',
          action: 'Enable more aggressive caching and parallel processing'
        });
      }
    }
    
    // Node.js version recommendations
    const nodeInfo = this.nodeManager.getVersionInfo();
    if (!nodeInfo.compatible) {
      recommendations.push({
        category: 'environment',
        priority: 'high',
        message: 'Node.js version is not optimal',
        action: `Upgrade to Node.js ${this.nodeManager.recommendedVersion} for better performance`
      });
    }
    
    return recommendations;
  }

  // Generate executive summary
  generateExecutiveSummary() {
    const summary = {
      overallStatus: this.results.overall.success ? 'SUCCESS' : 'NEEDS_ATTENTION',
      overallScore: this.results.overall.score,
      keyMetrics: {
        validationScore: this.results.validation?.summary?.overallScore || 0,
        dependencyScore: this.results.dependencies ? this.calculateDependencyScore(this.results.dependencies) : 0,
        buildScore: this.results.build ? this.calculateBuildScore(this.results.build) : 0
      },
      criticalIssues: this.results.overall.issues.filter(i => i.severity === 'high').length,
      totalOptimizationTime: this.monitor.getTimer('master_optimization'),
      topRecommendations: this.results.overall.recommendations.slice(0, 3)
    };
    
    return summary;
  }

  // Generate markdown report
  async generateMarkdownReport(report, markdownPath) {
    const markdown = `# BMAD Method - Optimization Report

**Generated:** ${report.metadata.timestamp}  
**Optimization Time:** ${Math.round(report.metadata.optimizationTime / 1000)}s  
**Overall Score:** ${report.results.overall.score}/100  
**Status:** ${report.summary.overallStatus}

## Executive Summary

${report.results.overall.success ? 
  '✅ **Optimization completed successfully!**' : 
  '⚠️ **Optimization completed with issues that need attention.**'
}

### Key Metrics
- **Validation Score:** ${report.summary.keyMetrics.validationScore}/100
- **Dependency Score:** ${report.summary.keyMetrics.dependencyScore}/100
- **Build Score:** ${report.summary.keyMetrics.buildScore}/100
- **Critical Issues:** ${report.summary.criticalIssues}

## Top Recommendations

${report.summary.topRecommendations.map((rec, index) => 
  `${index + 1}. **${rec.category.toUpperCase()}** (${rec.priority}): ${rec.message}\n   *Action:* ${rec.action}`
).join('\n\n')}

## Detailed Results

### Validation Results
- **Overall Score:** ${report.results.validation?.summary?.overallScore || 'N/A'}/100
- **Total Issues:** ${report.results.validation?.summary?.totalIssues || 0}
- **Critical Issues:** ${report.results.validation?.summary?.criticalIssues || 0}

### Dependency Management
- **Vulnerabilities:** ${report.results.dependencies?.audit?.vulnerabilities?.length || 0}
- **Outdated Packages:** ${report.results.dependencies?.audit?.outdated?.length || 0}
- **Duplicate Dependencies:** ${report.results.dependencies?.audit?.duplicates?.length || 0}

### Build Optimization
- **Caching Enabled:** ${report.results.build?.build?.cacheEnabled ? '✅' : '❌'}
- **Parallel Processing:** ${report.results.build?.build?.parallelProcessing ? '✅' : '❌'}
- **Build Time:** ${report.results.build?.build?.buildTime || 'N/A'}ms

## Performance Metrics

- **Total Optimization Time:** ${Math.round(report.performance.totalTime / 1000)}s
- **Memory Usage:** ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}MB
- **Node.js Version:** ${report.environment.nodeVersion.current}

---

*Report generated by BMAD Method Master Optimizer*
`;
    
    await fs.writeFile(markdownPath, markdown, 'utf8');
  }

  // Display comprehensive results
  displayComprehensiveResults(options) {
    console.log('\n' + '='.repeat(80));
    console.log(chalk.bold.blue('🎯 MASTER OPTIMIZATION RESULTS'));
    console.log('='.repeat(80));
    
    // Overall status
    const statusIcon = this.results.overall.success ? '🎉' : '⚠️';
    const statusColor = this.results.overall.success ? 'green' : 'yellow';
    
    console.log(`\n${statusIcon} ${chalk.bold[statusColor]('OVERALL STATUS:')} ${this.results.overall.success ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
    console.log(`📊 ${chalk.bold('OVERALL SCORE:')} ${this.getScoreColor(this.results.overall.score)}${this.results.overall.score}/100`);
    
    // Phase results
    console.log('\n' + chalk.bold('📋 PHASE RESULTS:'));
    
    if (this.results.validation) {
      const validationIcon = this.results.validation.overall === 'pass' ? '✅' : 
                            this.results.validation.overall === 'warning' ? '⚠️' : '❌';
      console.log(`${validationIcon} Validation: ${this.getScoreColor(this.results.validation.summary.overallScore)}${this.results.validation.summary.overallScore}/100`);
    }
    
    if (this.results.dependencies) {
      const depScore = this.calculateDependencyScore(this.results.dependencies);
      const depIcon = depScore >= 80 ? '✅' : depScore >= 60 ? '⚠️' : '❌';
      console.log(`${depIcon} Dependencies: ${this.getScoreColor(depScore)}${depScore}/100`);
    }
    
    if (this.results.build) {
      const buildScore = this.calculateBuildScore(this.results.build);
      const buildIcon = buildScore >= 80 ? '✅' : buildScore >= 60 ? '⚠️' : '❌';
      console.log(`${buildIcon} Build Optimization: ${this.getScoreColor(buildScore)}${buildScore}/100`);
    }
    
    // Issues summary
    if (this.results.overall.issues.length > 0) {
      console.log('\n' + chalk.bold.yellow('⚠️  ISSUES REQUIRING ATTENTION:'));
      this.results.overall.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'high' ? '🔴' : 
                           issue.severity === 'medium' ? '🟡' : '🔵';
        console.log(`${index + 1}. ${severityIcon} ${issue.message}`);
      });
    }
    
    // Top recommendations
    if (this.results.overall.recommendations.length > 0) {
      console.log('\n' + chalk.bold.cyan('💡 TOP RECOMMENDATIONS:'));
      this.results.overall.recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityIcon = rec.priority === 'critical' ? '🚨' : 
                           rec.priority === 'high' ? '🔴' : 
                           rec.priority === 'medium' ? '🟡' : '🔵';
        console.log(`${index + 1}. ${priorityIcon} ${chalk.bold(rec.category.toUpperCase())}: ${rec.message}`);
        console.log(`   ${chalk.gray('Action:')} ${rec.action}`);
      });
    }
    
    // Performance summary
    const totalTime = this.monitor.getTimer('master_optimization');
    const memoryUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    console.log('\n' + chalk.bold('⏱️  PERFORMANCE SUMMARY:'));
    console.log(`• Total optimization time: ${Math.round(totalTime / 1000)}s`);
    console.log(`• Memory usage: ${memoryUsed}MB`);
    console.log(`• Node.js version: ${this.nodeManager.getVersionInfo().current}`);
    
    // Next steps
    console.log('\n' + chalk.bold.green('🚀 NEXT STEPS:'));
    if (this.results.overall.success) {
      console.log('• ✅ Your BMAD Method installation is optimized!');
      console.log('• 📚 Review the generated documentation');
      console.log('• 🔄 Run periodic optimizations to maintain performance');
    } else {
      console.log('• 🔧 Address the issues and recommendations above');
      console.log('• 🔄 Re-run the optimization after fixes');
      console.log('• 📖 Consult the documentation for detailed guidance');
    }
    
    console.log('\n' + '='.repeat(80));
  }

  // Get score color
  getScoreColor(score) {
    if (score >= 90) return chalk.green;
    if (score >= 80) return chalk.yellow;
    if (score >= 60) return chalk.orange;
    return chalk.red;
  }
}

// CLI interface
if (require.main === module) {
  program
    .name('master-optimizer')
    .description('Master optimization script for BMAD Method')
    .version('1.0.0')
    .option('-p, --project-root <path>', 'Project root directory', process.cwd())
    .option('-s, --source-dir <path>', 'Source directory for build optimization')
    .option('-o, --output-dir <path>', 'Output directory for build optimization')
    .option('--skip-dependencies', 'Skip dependency management phase')
    .option('--skip-build', 'Skip build optimization phase')
    .option('--update-dependencies', 'Update dependencies to latest versions')
    .option('--install-dependencies', 'Install dependencies after updating')
    .option('--consolidate-dependencies', 'Consolidate duplicate dependencies')
    .option('--cleanup-dependencies', 'Clean up node_modules and lock files')
    .option('--update-node-requirements', 'Update Node.js engine requirements')
    .option('--ignore-vulnerabilities', 'Continue despite security vulnerabilities')
    .option('--force', 'Continue despite critical validation issues')
    .option('-r, --report <path>', 'Generate comprehensive report file', 'optimization-report.json')
    .option('-v, --verbose', 'Show detailed output')
    .option('--json', 'Output results as JSON')
    .action(async (options) => {
      const optimizer = new MasterOptimizer();
      
      if (options.verbose) {
        optimizer.logger.setLevel('debug');
      }
      
      try {
        const results = await optimizer.optimize(options);
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        }
        
        // Exit with appropriate code
        const exitCode = results.overall.success ? 0 : 
                        results.overall.issues.filter(i => i.severity === 'high').length > 0 ? 2 : 1;
        
        process.exit(exitCode);
        
      } catch (error) {
        console.error(chalk.red(`\n❌ Master optimization failed: ${error.message}`));
        
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
        
        process.exit(3);
      }
    });

  // Add individual phase commands
  program
    .command('validate')
    .description('Run only validation phase')
    .option('-p, --project-root <path>', 'Project root directory', process.cwd())
    .option('-v, --verbose', 'Show detailed output')
    .action(async (options) => {
      const validator = new InstallationValidator();
      try {
        await validator.validate(options);
      } catch (error) {
        console.error(chalk.red(`Validation failed: ${error.message}`));
        process.exit(1);
      }
    });

  program
    .command('dependencies')
    .description('Run only dependency management phase')
    .option('-p, --project-root <path>', 'Project root directory', process.cwd())
    .option('--update', 'Update dependencies')
    .option('--consolidate', 'Consolidate dependencies')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (options) => {
      const manager = new DependencyManager();
      try {
        await manager.manage(options);
      } catch (error) {
        console.error(chalk.red(`Dependency management failed: ${error.message}`));
        process.exit(1);
      }
    });

  program
    .command('build')
    .description('Run only build optimization phase')
    .option('-p, --project-root <path>', 'Project root directory', process.cwd())
    .option('-s, --source-dir <path>', 'Source directory')
    .option('-o, --output-dir <path>', 'Output directory')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (options) => {
      const optimizer = new BuildOptimizer();
      try {
        await optimizer.optimize(options);
      } catch (error) {
        console.error(chalk.red(`Build optimization failed: ${error.message}`));
        process.exit(1);
      }
    });

  program.parse();
}

module.exports = MasterOptimizer;