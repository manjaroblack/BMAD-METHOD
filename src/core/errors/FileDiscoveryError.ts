import { ServiceError } from "./ServiceError.ts";

export class FileDiscoveryError extends ServiceError {
  constructor(
    message: string,
    code?: string,
    cause?: Error,
  ) {
    super(message, code, cause);
    this.name = "FileDiscoveryError";

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileDiscoveryError);
    }
  }
}
