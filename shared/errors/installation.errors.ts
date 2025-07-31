/**
 * Installation-specific error definitions for BMAD-METHOD
 * Provides structured error handling for installation processes
 */

export class InstallationError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'InstallationError';
    this.code = code;
    this.context = context;
  }
}

export class DirectoryNotFoundError extends InstallationError {
  constructor(directory: string) {
    super(
      `Installation directory not found: ${directory}`,
      'DIRECTORY_NOT_FOUND',
      { directory }
    );
    this.name = 'DirectoryNotFoundError';
  }
}

export class InsufficientPermissionsError extends InstallationError {
  constructor(path: string) {
    super(
      `Insufficient permissions to access: ${path}`,
      'INSUFFICIENT_PERMISSIONS',
      { path }
    );
    this.name = 'InsufficientPermissionsError';
  }
}

export class CorruptedInstallationError extends InstallationError {
  constructor(details: string) {
    super(
      `Installation is corrupted: ${details}`,
      'CORRUPTED_INSTALLATION',
      { details }
    );
    this.name = 'CorruptedInstallationError';
  }
}

export class UnsupportedVersionError extends InstallationError {
  constructor(currentVersion: string, requiredVersion: string) {
    super(
      `Unsupported version: ${currentVersion}. Required: ${requiredVersion}`,
      'UNSUPPORTED_VERSION',
      { currentVersion, requiredVersion }
    );
    this.name = 'UnsupportedVersionError';
  }
}

export class DependencyResolutionError extends InstallationError {
  constructor(dependency: string, reason: string) {
    super(
      `Failed to resolve dependency '${dependency}': ${reason}`,
      'DEPENDENCY_RESOLUTION_FAILED',
      { dependency, reason }
    );
    this.name = 'DependencyResolutionError';
  }
}

export class InstallationTimeoutError extends InstallationError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Installation operation '${operation}' timed out after ${timeoutMs}ms`,
      'INSTALLATION_TIMEOUT',
      { operation, timeoutMs }
    );
    this.name = 'InstallationTimeoutError';
  }
}

export class IntegrityCheckFailedError extends InstallationError {
  constructor(missingFiles: string[], modifiedFiles: string[]) {
    super(
      `Integrity check failed. Missing: ${missingFiles.length}, Modified: ${modifiedFiles.length}`,
      'INTEGRITY_CHECK_FAILED',
      { missingFiles, modifiedFiles }
    );
    this.name = 'IntegrityCheckFailedError';
  }
}
