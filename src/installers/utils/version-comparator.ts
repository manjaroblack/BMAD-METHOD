/**
 * Version Comparator Utility for BMAD-METHOD
 * Provides semantic version comparison and validation
 */

import type { ILogger } from 'deps';

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
  raw: string;
}

export interface VersionComparisonResult {
  result: -1 | 0 | 1; // -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
  details: {
    v1: VersionInfo;
    v2: VersionInfo;
    comparison: string;
  };
}

export class VersionComparator {
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Compare two semantic version strings
   * @param version1 First version to compare
   * @param version2 Second version to compare
   * @returns -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
   */
  compare(version1: string, version2: string): number {
    try {
      const v1 = this.parseVersion(version1);
      const v2 = this.parseVersion(version2);

      // Compare major versions
      if (v1.major !== v2.major) {
        return v1.major < v2.major ? -1 : 1;
      }

      // Compare minor versions
      if (v1.minor !== v2.minor) {
        return v1.minor < v2.minor ? -1 : 1;
      }

      // Compare patch versions
      if (v1.patch !== v2.patch) {
        return v1.patch < v2.patch ? -1 : 1;
      }

      // Compare prerelease versions
      if (v1.prerelease && v2.prerelease) {
        return this.comparePrerelease(v1.prerelease, v2.prerelease);
      }

      // Version with prerelease is lower than without
      if (v1.prerelease && !v2.prerelease) return -1;
      if (!v1.prerelease && v2.prerelease) return 1;

      return 0;

    } catch (error) {
      this.logger?.error('Failed to compare versions', error as Error, {
        version1,
        version2
      });
      // Fallback to string comparison
      return version1.localeCompare(version2);
    }
  }

  /**
   * Compare two versions and return detailed result
   */
  compareDetailed(version1: string, version2: string): VersionComparisonResult {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);
    const result = this.compare(version1, version2) as -1 | 0 | 1;

    let comparison: string;
    if (result < 0) {
      comparison = `${version1} < ${version2}`;
    } else if (result > 0) {
      comparison = `${version1} > ${version2}`;
    } else {
      comparison = `${version1} = ${version2}`;
    }

    return {
      result,
      details: {
        v1,
        v2,
        comparison
      }
    };
  }

  /**
   * Check if a version satisfies a range constraint
   * @param version Version to check
   * @param constraint Version constraint (e.g., ">=1.0.0", "~1.2.0", "^1.0.0")
   */
  satisfies(version: string, constraint: string): boolean {
    try {
      // Handle special cases
      if (constraint === '*' || constraint === 'latest') {
        return true;
      }

      // Parse constraint
      const constraintMatch = constraint.match(/^([~^>=<]*)(.+)$/);
      if (!constraintMatch) {
        // Exact match if no operator
        return this.compare(version, constraint) === 0;
      }

      const [, operator = '', constraintVersion = ''] = constraintMatch;
      if (!constraintVersion) {
        return false;
      }
      const comparison = this.compare(version, constraintVersion);

      switch (operator) {
        case '>=':
          return comparison >= 0;
        case '>':
          return comparison > 0;
        case '<=':
          return comparison <= 0;
        case '<':
          return comparison < 0;
        case '=':
        case '':
          return comparison === 0;
        case '~':
          return constraintVersion ? this.satisfiesTilde(version, constraintVersion) : false;
        case '^':
          return constraintVersion ? this.satisfiesCaret(version, constraintVersion) : false;
        default:
          return comparison === 0;
      }

    } catch (error) {
      this.logger?.error('Failed to check version constraint', error as Error, {
        version,
        constraint
      });
      return false;
    }
  }

  /**
   * Get the latest version from an array of version strings
   */
  getLatest(versions: string[]): string | null {
    if (versions.length === 0) return null;
    if (versions.length === 1) return versions[0] || null;

    return versions.reduce((latest, current) => {
      return this.compare(current, latest) > 0 ? current : latest;
    });
  }

  /**
   * Sort versions in ascending order
   */
  sort(versions: string[]): string[] {
    return [...versions].sort((a, b) => this.compare(a, b));
  }

  /**
   * Sort versions in descending order
   */
  sortDescending(versions: string[]): string[] {
    return [...versions].sort((a, b) => this.compare(b, a));
  }

  /**
   * Validate if a string is a valid semantic version
   */
  isValid(version: string): boolean {
    try {
      this.parseVersion(version);
      return true;
    } catch {
      return false;
    }
  }

  private parseVersion(version: string): VersionInfo {
    // Handle special cases
    if (version === 'unknown' || version === 'latest') {
      return {
        major: 0,
        minor: 0,
        patch: 0,
        raw: version
      };
    }

    // Clean version string
    const cleanVersion = version.replace(/^v/, '').trim();
    
    // Parse semantic version pattern
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-\.]+))?(?:\+([a-zA-Z0-9\-\.]+))?$/;
    const match = cleanVersion.match(versionRegex);

    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    const [, major = '0', minor = '0', patch = '0', prerelease, build] = match;

    return {
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch, 10),
      prerelease,
      build,
      raw: version
    };
  }

  private comparePrerelease(pre1: string, pre2: string): number {
    const parts1 = pre1.split('.');
    const parts2 = pre2.split('.');
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || '';
      const part2 = parts2[i] || '';

      // If one is missing, it's considered lower
      if (!part1 && part2) return -1;
      if (part1 && !part2) return 1;

      // Compare numerically if both are numbers
      const num1 = parseInt(part1, 10);
      const num2 = parseInt(part2, 10);

      if (!isNaN(num1) && !isNaN(num2)) {
        if (num1 !== num2) {
          return num1 < num2 ? -1 : 1;
        }
      } else {
        // String comparison
        const stringCompare = part1.localeCompare(part2);
        if (stringCompare !== 0) {
          return stringCompare < 0 ? -1 : 1;
        }
      }
    }

    return 0;
  }

  private satisfiesTilde(version: string, constraint: string): boolean {
    const v = this.parseVersion(version);
    const c = this.parseVersion(constraint);

    // ~1.2.3 := >=1.2.3 <1.3.0
    return v.major === c.major && 
           v.minor === c.minor && 
           v.patch >= c.patch;
  }

  private satisfiesCaret(version: string, constraint: string): boolean {
    const v = this.parseVersion(version);
    const c = this.parseVersion(constraint);

    // ^1.2.3 := >=1.2.3 <2.0.0
    if (c.major > 0) {
      return v.major === c.major && 
             (v.minor > c.minor || 
              (v.minor === c.minor && v.patch >= c.patch));
    }

    // ^0.2.3 := >=0.2.3 <0.3.0
    if (c.minor > 0) {
      return v.major === 0 && 
             v.minor === c.minor && 
             v.patch >= c.patch;
    }

    // ^0.0.3 := >=0.0.3 <0.0.4
    return v.major === 0 && 
           v.minor === 0 && 
           v.patch === c.patch;
  }
}

// Export singleton instance
export const versionComparator = new VersionComparator();

// Export factory function
export function createVersionComparator(logger?: ILogger): VersionComparator {
  return new VersionComparator(logger);
}
