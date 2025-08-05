// Refactored resource locator service for BMad Method installer
// Implements IResourceLocator interface

import {
  expandGlob as _expandGlob,
  extractYamlFromAgent as _extractYamlFromAgent,
  join,
  parseYaml as _parseYaml,
  ProjectPaths,
} from "deps";

import type { IResourceLocator } from "deps";

export class ResourceLocator implements IResourceLocator {
  private _pathCache = new Map<string, string>();

  /**
   * Get BMad core path
   */
  getBmadCorePath(): string {
    return ProjectPaths.core;
  }

  /**
   * Get expansion packs path
   */
  getExpansionPacksPath(): string {
    return ProjectPaths.extensions;
  }

  /**
   * Get expansion pack path by ID
   * @param packId - Expansion pack ID
   */
  getExpansionPackPath(packId: string): string {
    const cacheKey = `expansion-pack-path:${packId}`;
    if (this._pathCache.has(cacheKey)) {
      return this._pathCache.get(cacheKey)!;
    }

    const path = join(ProjectPaths.extensions, packId);
    this._pathCache.set(cacheKey, path);
    return path;
  }
}

// Export singleton instance
