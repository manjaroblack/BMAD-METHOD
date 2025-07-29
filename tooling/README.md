# BMAD Method - Tooling Documentation

This directory contains comprehensive tooling for code quality improvements, performance optimizations, and installation management for the BMAD Method project.

## 🚀 Quick Start

### Master Optimization Script

Run the complete optimization suite:

```bash
# Full optimization with all phases
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts

# With custom options
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts \
  --project-root /path/to/project \
  --update-dependencies \
  --consolidate-dependencies \
  --report optimization-report.json \
  --verbose

# Skip specific phases
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts \
  --skip-dependencies \
  --skip-build

# Force optimization despite critical issues
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts --force
```

### Individual Phase Commands

```bash
# Run only validation
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts validate --verbose

# Run only dependency management
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts dependencies --update --consolidate

# Run only build optimization
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts build --source-dir src --output-dir dist
```

## 📁 Directory Structure

```
tooling/
├── lib/                          # Core utility libraries
│   ├── error-handler.ts          # Standardized error handling
│   ├── performance-optimizer.ts  # Performance optimization utilities
│   └── node-version-manager.ts   # Deno version management
├── scripts/                      # Optimization scripts
│   ├── master-optimizer.ts       # Main orchestration script
│   ├── optimize-build.ts         # Build process optimization
│   ├── validate-installation.ts  # Installation validation
│   └── manage-dependencies.ts    # Dependency management
├── build-tools/                  # Build system tools
│   └── web-builder.ts           # Enhanced web builder with optimizations
├── installers/                   # Installation tools
│   ├── lib/
│   │   ├── installer.ts          # Enhanced installer with validation
│   │   ├── installer-validator.ts # Installation validation utilities
│   │   └── incremental-updater.ts # Incremental update utilities
│   └── package.json             # Installer dependencies
├── development-tools/            # Development and maintenance utilities
└── package.json                 # Main tooling dependencies
```

## 🛠️ Core Libraries

### Error Handler (`lib/error-handler.ts`)

Standardized error handling across all tooling:

```javascript
import { BMadError, Logger } from "./lib/error-handler.ts";

// Create logger with different levels
const logger = new Logger("debug"); // debug, info, warn, error

// Throw standardized errors
throw new BMadError("VALIDATION_FAILED", "Custom error message");

// Handle errors gracefully
try {
  // risky operation
} catch (error) {
  logger.error("Operation failed:", error);
  process.exit(1);
}
```

**Features:**

- Consistent error types and codes
- Structured logging with levels
- Graceful shutdown handling
- Performance monitoring integration

### Performance Optimizer (`lib/performance-optimizer.ts`)

Performance optimization utilities:

```javascript
import {
  CacheManager,
  ParallelProcessor,
  PerformanceMonitor,
} from "./lib/performance-optimizer.ts";

// Caching
const cache = new CacheManager();
const result = await cache.get("key", async () => {
  return expensiveOperation();
});

// Parallel processing
const processor = new ParallelProcessor();
const results = await processor.processInParallel(items, async (item) => {
  return processItem(item);
});

// Performance monitoring
const monitor = new PerformanceMonitor();
monitor.startTimer("operation");
// ... do work ...
monitor.endTimer("operation");
console.log(monitor.getTimer("operation")); // milliseconds
```

**Features:**

- In-memory and file-based caching
- Parallel task processing with concurrency control
- Performance timing and monitoring
- Batch file operations
- Dependency caching

### Deno Version Manager (`lib/node-version-manager.ts`)

Deno version management and validation:

```javascript
import { NodeVersionManager } from "./lib/node-version-manager.ts";

const manager = new NodeVersionManager();

// Check current version compatibility
const versionInfo = manager.getVersionInfo();
console.log(versionInfo.compatible); // true/false

// Update package.json engines
await manager.updatePackageEngines("/path/to/package.json");

// Generate .nvmrc file
await manager.generateNvmrc("/path/to/project");

// Create Dockerfile with specific Node version
await manager.generateDockerfile("/path/to/project", "18.17.0");
```

**Features:**

- Version compatibility checking
- Package.json engine field updates
- .nvmrc file generation
- Dockerfile generation
- GitHub Actions workflow generation

## 📋 Optimization Scripts

### Master Optimizer (`scripts/master-optimizer.js`)

Orchestrates all optimization phases:

**Phases:**

1. **Pre-optimization validation** - Checks system readiness
2. **Dependency management** - Updates, audits, and consolidates dependencies
3. **Build optimization** - Enhances build performance with caching and parallel processing
4. **Post-optimization validation** - Verifies improvements
5. **Comprehensive reporting** - Generates detailed reports

**Options:**

- `--project-root <path>` - Project root directory
- `--skip-dependencies` - Skip dependency management
- `--skip-build` - Skip build optimization
- `--update-dependencies` - Update to latest versions
- `--consolidate-dependencies` - Remove duplicates
- `--force` - Continue despite critical issues
- `--report <path>` - Generate report file
- `--verbose` - Detailed output
- `--json` - JSON output format

### Build Optimizer (`scripts/optimize-build.ts`)

Optimizes build processes:

```bash
# Basic optimization
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/optimize-build.ts

# With custom directories
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/optimize-build.ts \
  --source-dir src \
  --output-dir dist \
  --dependencies \
  --build
```

**Features:**

- Dependency optimization and caching
- Build process enhancement
- Performance monitoring
- Parallel processing
- Cache management

### Installation Validator (`scripts/validate-installation.ts`)

Validates installation integrity:

```bash
# Full validation
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/validate-installation.ts

# Quick validation
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/validate-installation.ts --quick

# Generate report
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/validate-installation.ts --report validation-report.json
```

**Validation Categories:**

- **Environment** - Node.js version, disk space, permissions
- **Installation** - Core files, expansion packs, configuration
- **Configuration** - Settings validation, path resolution
- **Performance** - Load times, memory usage

### Dependency Manager (`scripts/manage-dependencies.ts`)

Manages project dependencies:

```bash
# Audit dependencies
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts --audit

# Update and consolidate
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts \
  --update \
  --consolidate \
  --install

# Clean up
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts --cleanup
```

**Features:**

- Security vulnerability scanning
- Outdated package detection
- Duplicate dependency identification
- Version consolidation
- Cleanup operations

## 🔧 Enhanced Build Tools

### Web Builder (`build-tools/web-builder.ts`)

Enhanced with performance optimizations:

**New Features:**

- File caching with `CacheManager`
- Parallel file processing
- Performance monitoring
- Optimized YAML parsing
- Batch operations

**Usage:**

```javascript
import { WebBuilder } from "./build-tools/web-builder.ts";

const builder = new WebBuilder({
  enableCache: true,
  enableParallelProcessing: true,
});

// Use cached file reading
const content = await builder.readFileWithCache("/path/to/file");

// Process files in parallel
const results = await builder.processFilesInParallel(files, processor);
```

## 🚀 Enhanced Installers

### Installer (`installers/lib/installer.ts`)

Enhanced with validation and performance monitoring:

**New Features:**

- Prerequisite validation
- Installation integrity checks
- Performance monitoring
- Error handling standardization
- Incremental updates

### Installer Validator (`installers/lib/installer-validator.ts`)

Comprehensive installation validation:

**Validation Types:**

- **Prerequisites** - System requirements
- **Installation Integrity** - File validation
- **Configuration** - Settings verification
- **Performance** - System performance checks

### Incremental Updater (`installers/lib/incremental-updater.ts`)

Optimized update processes:

**Features:**

- Manifest-based updates
- File change detection
- Incremental copying
- Cache management
- Performance optimization

## 📊 Reporting and Monitoring

### Report Generation

All scripts generate comprehensive reports:

**JSON Report Structure:**

```json
{
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "optimizationTime": 45000
  },
  "results": {
    "validation": {/* validation results */},
    "dependencies": {/* dependency results */},
    "build": {/* build results */},
    "overall": {
      "success": true,
      "score": 95,
      "issues": [],
      "recommendations": []
    }
  },
  "performance": {
    "totalTime": 45000,
    "phaseBreakdown": {/* timing details */},
    "memoryUsage": {/* memory stats */}
  }
}
```

**Markdown Summary:**
Each JSON report includes a companion markdown file with:

- Executive summary
- Key metrics
- Recommendations
- Detailed results
- Performance metrics

### Performance Monitoring

All scripts include performance monitoring:

- **Timing** - Phase and operation timing
- **Memory** - Memory usage tracking
- **Caching** - Cache hit/miss rates
- **Parallel Processing** - Concurrency metrics

## 🔍 Error Handling and Logging

### Standardized Error Types

- `VALIDATION_FAILED` - Validation errors
- `DEPENDENCY_ERROR` - Dependency issues
- `BUILD_ERROR` - Build process errors
- `INSTALLATION_ERROR` - Installation problems
- `CONFIGURATION_ERROR` - Configuration issues
- `PERFORMANCE_ERROR` - Performance problems

### Logging Levels

- `debug` - Detailed debugging information
- `info` - General information
- `warn` - Warning messages
- `error` - Error messages

### Exit Codes

- `0` - Success
- `1` - General failure
- `2` - Critical issues found
- `3` - Fatal error

## 🎯 Best Practices

### Running Optimizations

1. **Start with validation:**
   ```bash
   deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts validate --verbose
   ```

2. **Run full optimization:**
   ```bash
   deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts --report optimization-report.json
   ```

3. **Address issues and re-run:**
   ```bash
   deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts --force
   ```

### Maintenance Schedule

- **Weekly:** Run dependency audits
- **Monthly:** Full optimization suite
- **Before releases:** Complete validation and optimization
- **After major changes:** Validation and targeted optimization

### Performance Tips

1. **Enable caching** for repeated operations
2. **Use parallel processing** for file operations
3. **Monitor performance** with built-in timing
4. **Clean up regularly** with dependency cleanup
5. **Update dependencies** to latest stable versions

## 🔧 Configuration

### Environment Variables

- `BMAD_LOG_LEVEL` - Set logging level (debug, info, warn, error)
- `BMAD_CACHE_DIR` - Custom cache directory
- `BMAD_PARALLEL_LIMIT` - Parallel processing limit
- `BMAD_PERFORMANCE_MONITORING` - Enable/disable performance monitoring

### Deno Tasks

Add these tasks to your deno.json:

```json
{
  "tasks": {
    "optimize": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts",
    "optimize:full": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts --update-dependencies --consolidate-dependencies --report optimization-report.json",
    "validate": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts validate",
    "deps:audit": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts --audit",
    "deps:update": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts --update --install",
    "build:optimize": "deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/optimize-build.ts"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Errors:**
   ```bash
   # Fix file permissions
   chmod +x tooling/scripts/*.ts
   ```

2. **Deno Version Issues:**
   ```bash
   # Check Deno version
   deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts validate
   ```

3. **Dependency Conflicts:**
   ```bash
   # Clean and reinstall
   deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/manage-dependencies.ts --cleanup
   deno cache deps.ts
   ```

4. **Cache Issues:**
   ```bash
   # Clear cache
   rm -rf .bmad-cache
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set environment variable
export BMAD_LOG_LEVEL=debug

# Or use --verbose flag
deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts --verbose
```

### Getting Help

1. **Check logs** in verbose mode
2. **Review generated reports** for detailed information
3. **Run individual phases** to isolate issues
4. **Check system requirements** with validation script

## 📈 Metrics and Scoring

### Overall Score Calculation

- **Validation Score** (0-100): Based on validation checks
- **Dependency Score** (0-100): Based on security, outdated packages, duplicates
- **Build Score** (0-100): Based on performance and optimizations
- **Overall Score**: Average of all component scores

### Success Criteria

- **Success**: Overall score ≥ 80 and no high-severity issues
- **Warning**: Overall score 60-79 or medium-severity issues
- **Failure**: Overall score < 60 or high-severity issues

## 🔄 Continuous Integration

Integrate with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run BMAD Optimization
  run: |
    deno run --allow-read --allow-write --allow-env --allow-run tooling/scripts/master-optimizer.ts \
      --report optimization-report.json \
      --json > optimization-results.json

- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: optimization-reports
    path: |
      optimization-report.json
      optimization-report.md
      optimization-results.json
```

---

## 📝 License

This tooling is part of the BMAD Method project and follows the same license terms.

## 🤝 Contributing

When contributing to the tooling:

1. Follow the established error handling patterns
2. Include performance monitoring
3. Add comprehensive logging
4. Update documentation
5. Include tests for new functionality

---

_Generated by BMAD Method Tooling Documentation Generator_
