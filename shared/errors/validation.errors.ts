/**
 * Validation-specific error definitions for BMAD-METHOD
 * Provides structured error handling for validation processes
 */

export class ValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, field?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.context = context;
  }
}

export class ConfigValidationError extends ValidationError {
  constructor(field: string, reason: string) {
    super(
      `Configuration validation failed for '${field}': ${reason}`,
      'CONFIG_VALIDATION_FAILED',
      field,
      { reason }
    );
    this.name = 'ConfigValidationError';
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(schemaPath: string, errors: string[]) {
    super(
      `Schema validation failed at '${schemaPath}': ${errors.join(', ')}`,
      'SCHEMA_VALIDATION_FAILED',
      schemaPath,
      { errors }
    );
    this.name = 'SchemaValidationError';
  }
}

export class RequiredFieldMissingError extends ValidationError {
  constructor(field: string) {
    super(
      `Required field '${field}' is missing`,
      'REQUIRED_FIELD_MISSING',
      field
    );
    this.name = 'RequiredFieldMissingError';
  }
}

export class InvalidValueError extends ValidationError {
  constructor(field: string, value: unknown, expectedType: string) {
    super(
      `Invalid value for '${field}': expected ${expectedType}, got ${typeof value}`,
      'INVALID_VALUE',
      field,
      { value, expectedType }
    );
    this.name = 'InvalidValueError';
  }
}

export class ValidationCollectionError extends ValidationError {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = `Multiple validation errors: ${errors.map(e => e.message).join('; ')}`;
    super(message, 'VALIDATION_COLLECTION', undefined, { errorCount: errors.length });
    this.name = 'ValidationCollectionError';
    this.errors = errors;
  }
}
