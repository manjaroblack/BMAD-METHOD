export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ServiceError';
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }
}
