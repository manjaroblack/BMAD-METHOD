/**
 * Installation result type definitions for BMAD-METHOD
 * Defines the structure of results returned by installation operations
 */

export interface InstallationResult {
  success: boolean;
  type: string;
  message?: string;
  error?: string;
  manifest?: Record<string, unknown>;
}
