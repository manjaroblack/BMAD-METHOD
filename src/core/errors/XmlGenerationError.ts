import { ServiceError } from "./ServiceError.ts";

export class XmlGenerationError extends ServiceError {
  constructor(
    message: string,
    code?: string,
    cause?: Error,
  ) {
    super(message, code, cause);
    this.name = "XmlGenerationError";

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, XmlGenerationError);
    }
  }
}
