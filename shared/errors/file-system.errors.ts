/**
 * File System-specific error definitions for BMAD-METHOD
 * Provides structured error handling for file system operations
 */

export class FileSystemError extends Error {
  public readonly code: string;
  public readonly path?: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, path?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
    this.path = path;
    this.context = context;
  }
}

export class FileNotFoundError extends FileSystemError {
  constructor(path: string) {
    super(
      `File not found: ${path}`,
      'FILE_NOT_FOUND',
      path
    );
    this.name = 'FileNotFoundError';
  }
}

export class DirectoryNotFoundError extends FileSystemError {
  constructor(path: string) {
    super(
      `Directory not found: ${path}`,
      'DIRECTORY_NOT_FOUND',
      path
    );
    this.name = 'DirectoryNotFoundError';
  }
}

export class PermissionDeniedError extends FileSystemError {
  constructor(path: string, operation: string) {
    super(
      `Permission denied for ${operation} operation on: ${path}`,
      'PERMISSION_DENIED',
      path,
      { operation }
    );
    this.name = 'PermissionDeniedError';
  }
}

export class FileAlreadyExistsError extends FileSystemError {
  constructor(path: string) {
    super(
      `File already exists: ${path}`,
      'FILE_ALREADY_EXISTS',
      path
    );
    this.name = 'FileAlreadyExistsError';
  }
}

export class DirectoryNotEmptyError extends FileSystemError {
  constructor(path: string) {
    super(
      `Directory not empty: ${path}`,
      'DIRECTORY_NOT_EMPTY',
      path
    );
    this.name = 'DirectoryNotEmptyError';
  }
}

export class FileTooLargeError extends FileSystemError {
  constructor(path: string, size: number, maxSize: number) {
    super(
      `File too large: ${path} (${size} bytes, max: ${maxSize} bytes)`,
      'FILE_TOO_LARGE',
      path,
      { size, maxSize }
    );
    this.name = 'FileTooLargeError';
  }
}

export class InvalidPathError extends FileSystemError {
  constructor(path: string, reason: string) {
    super(
      `Invalid path: ${path} (${reason})`,
      'INVALID_PATH',
      path,
      { reason }
    );
    this.name = 'InvalidPathError';
  }
}

export class FileCorruptedError extends FileSystemError {
  constructor(path: string, details: string) {
    super(
      `File corrupted: ${path} (${details})`,
      'FILE_CORRUPTED',
      path,
      { details }
    );
    this.name = 'FileCorruptedError';
  }
}

export class DiskSpaceError extends FileSystemError {
  constructor(path: string, requiredSpace: number, availableSpace: number) {
    super(
      `Insufficient disk space for operation on: ${path} (required: ${requiredSpace} bytes, available: ${availableSpace} bytes)`,
      'INSUFFICIENT_DISK_SPACE',
      path,
      { requiredSpace, availableSpace }
    );
    this.name = 'DiskSpaceError';
  }
}
