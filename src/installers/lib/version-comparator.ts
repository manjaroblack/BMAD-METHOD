/**
 * Interface for version comparison
 */
export interface IVersionComparator {
  compareVersions(version1: string, version2: string): number;
}

/**
 * Service for comparing versions
 */
export class VersionComparator implements IVersionComparator {
  /**
   * Compare two version strings
   * @param version1 - First version string
   * @param version2 - Second version string
   * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 < v2) return -1;
      if (v1 > v2) return 1;
    }

    return 0;
  }
}
