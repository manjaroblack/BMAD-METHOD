/**
 * Safe filesystem utilities that don't throw errors on non-existent paths
 * These functions handle NotFound and PermissionDenied errors gracefully
 */

/**
 * Safely check if a path exists without throwing errors
 * Uses Deno.stat directly to avoid import issues with std/fs exists
 */
export async function Deno.stat(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    // Path doesn't exist or permission denied
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Safely check if a path exists and is a directory
 */
export async function safeIsDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
      return false;
    }
    throw error;
  }
}

/**
 * Safely check if a path exists and is a file
 */
export async function safeIsFile(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
      return false;
    }
    throw error;
  }
}
