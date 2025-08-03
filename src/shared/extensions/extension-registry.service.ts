/**
 * Extension Registry Service - Central registry for managing extension metadata and discovery
 */

import {
  ExtensionManifest,
  ExtensionMetrics,
  ExtensionSearchCriteria,
  ExtensionStatus,
  ExtensionType,
} from "deps";

export interface IExtensionRegistry {
  register(manifest: ExtensionManifest): void;
  unregister(extensionId: string): void;
  get(extensionId: string): ExtensionManifest | undefined;
  getAll(): ExtensionManifest[];
  search(criteria: ExtensionSearchCriteria): ExtensionManifest[];
  getByType(type: ExtensionType): ExtensionManifest[];
  getByStatus(status: ExtensionStatus): ExtensionManifest[];
  getByCategory(category: string): ExtensionManifest[];
  has(extensionId: string): boolean;
  updateStatus(extensionId: string, status: ExtensionStatus): void;
  getMetrics(): ExtensionMetrics;
  getDependencyGraph(): ExtensionDependencyGraph;
  validateDependencies(extensionId: string): ExtensionDependencyValidation;
}

export interface ExtensionDependencyGraph {
  nodes: ExtensionGraphNode[];
  edges: ExtensionGraphEdge[];
  cycles: string[][];
}

export interface ExtensionGraphNode {
  id: string;
  label: string;
  status: ExtensionStatus;
  type: ExtensionType;
}

export interface ExtensionGraphEdge {
  from: string;
  to: string;
  type: "required" | "optional";
  version?: string;

}

export interface ExtensionDependencyValidation {
  valid: boolean;
  missingDependencies: string[];
  versionConflicts: ExtensionVersionConflict[];
  circularDependencies: string[];
}

export interface ExtensionVersionConflict {
  dependencyId: string;
  requiredVersion: string;
  availableVersion: string;
}

export class ExtensionRegistry implements IExtensionRegistry {
  private extensions: Map<string, ExtensionManifest> = new Map();
  private typeIndex: Map<ExtensionType, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private statusIndex: Map<ExtensionStatus, Set<string>> = new Map();

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes() {
    this.extensions.forEach((manifest) => {
      this.updateIndexes(manifest, "add");
    });
  }

  private updateIndexes(manifest: ExtensionManifest, operation: "add" | "remove") {
    const { id, type, category } = manifest.config;

    // Update type index
    let typeSet = this.typeIndex.get(type);
    if (!typeSet) {
      typeSet = new Set();
      this.typeIndex.set(type, typeSet);
    }
    if (operation === "add") {
      typeSet.add(id);
    } else {
      typeSet.delete(id);
    }

    // Update category index
    let categorySet = this.categoryIndex.get(category);
    if (!categorySet) {
      categorySet = new Set();
      this.categoryIndex.set(category, categorySet);
    }
    if (operation === "add") {
      categorySet.add(id);
    } else {
      categorySet.delete(id);
    }

    // Update status index
    let statusSet = this.statusIndex.get(manifest.status);
    if (!statusSet) {
      statusSet = new Set();
      this.statusIndex.set(manifest.status, statusSet);
    }
    if (operation === "add") {
      statusSet.add(id);
    } else {
      statusSet.delete(id);
    }
  }

  has(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }


  register(manifest: ExtensionManifest): void {
    const extensionId = manifest.config.id;

    if (this.extensions.has(extensionId)) {
      throw new Error(`Extension ${extensionId} is already registered`);
    }

    // Store the manifest
    this.extensions.set(extensionId, manifest);

    // Update indexes
    this.updateIndexes(manifest, "add");
  }

  unregister(extensionId: string): void {
    const manifest = this.extensions.get(extensionId);
    if (!manifest) {
      throw new Error(`Extension ${extensionId} is not registered`);
    }

    // Remove from storage
    this.extensions.delete(extensionId);

    // Update indexes
    this.updateIndexes(manifest, "remove");
  }

  get(extensionId: string): ExtensionManifest | undefined {
    return this.extensions.get(extensionId);
  }

  getAll(): ExtensionManifest[] {
    return Array.from(this.extensions.values());
  }


  search(criteria: ExtensionSearchCriteria): ExtensionManifest[] {
    let candidates = this.getAll();

    // Filter by type
    if (criteria.type) {
      const typeSet = this.typeIndex.get(criteria.type);
      if (typeSet) {
        candidates = candidates.filter((ext) => typeSet.has(ext.config.id));
      } else {
        return [];
      }
    }

    // Filter by category
    if (criteria.category) {
      const categorySet = this.categoryIndex.get(criteria.category);
      if (categorySet) {
        candidates = candidates.filter((ext) => categorySet.has(ext.config.id));
      } else {
        return [];
      }
    }

    // Filter by status
    if (criteria.status) {
      const statusSet = this.statusIndex.get(criteria.status);
      if (statusSet) {
        candidates = candidates.filter((ext) => statusSet.has(ext.config.id));
      } else {
        return [];
      }
    }

    // Filter by author
    if (criteria.author) {
      candidates = candidates.filter((ext) => ext.config.author === criteria.author);
    }

    // Filter by keywords
    if (criteria.keywords && criteria.keywords.length > 0) {
      candidates = candidates.filter((ext) =>
        criteria.keywords!.some((keyword) =>
          ext.config.keywords.some((extKeyword) =>
            extKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );
    }

    return candidates;
  }

  getByType(type: ExtensionType): ExtensionManifest[] {
    return this.search({ type });
  }

  getByStatus(status: ExtensionStatus): ExtensionManifest[] {
    return this.search({ status });
  }

  getByCategory(category: string): ExtensionManifest[] {
    return this.search({ category });
  }

  updateStatus(extensionId: string, status: ExtensionStatus): void {
    const manifest = this.extensions.get(extensionId);
    if (!manifest) {
      throw new Error(`Extension ${extensionId} is not registered`);
    }

    const oldStatus = manifest.status;
    manifest.status = status;

    // Update status index
    this.statusIndex.get(oldStatus)?.delete(extensionId);
    this.statusIndex.get(status)?.add(extensionId);
  }

  getMetrics(): ExtensionMetrics {
    const extensions = this.getAll();

    const metrics: ExtensionMetrics = {
      totalExtensions: extensions.length,
      activeExtensions: this.getByStatus(ExtensionStatus.ACTIVE).length,
      loadedExtensions: extensions.filter((ext) => ext.loadedAt).length,
      errorExtensions: this.getByStatus(ExtensionStatus.ERROR).length,
      averageLoadTime: 0,
      extensionsByType: {} as Record<ExtensionType, number>,
      extensionsByStatus: {} as Record<ExtensionStatus, number>,
    };

    // Calculate average load time
    const loadTimes = extensions
      .filter((ext) => ext.loadedAt)
      .map((ext) => ext.loadedAt!.getTime());

    if (loadTimes.length > 0) {
      metrics.averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    }

    // Count by type
    Object.values(ExtensionType).forEach((type) => {
      metrics.extensionsByType[type] = this.typeIndex.get(type)?.size || 0;
    });

    // Count by status
    Object.values(ExtensionStatus).forEach((status) => {
      metrics.extensionsByStatus[status] = this.statusIndex.get(status)?.size || 0;
    });

    return metrics;
  }

  getDependencyGraph(): ExtensionDependencyGraph {
    const nodes: ExtensionGraphNode[] = [];
    const edges: ExtensionGraphEdge[] = [];
    const extensions = this.getAll();

    // Create nodes
    extensions.forEach((ext) => {
      nodes.push({
        id: ext.config.id,
        label: ext.config.name,
        status: ext.status,
        type: ext.config.type,
      });
    });

    // Create edges
    extensions.forEach((ext) => {
      ext.config.dependencies.forEach((dep) => {
        edges.push({
          from: ext.config.id,
          to: dep.id,
          type: dep.optional ? "optional" : "required"
        });
      });
    });

    // Detect cycles
    const cycles = this.detectCircularDependencies(edges);

    return { nodes, edges, cycles };
  }



  private detectCircularDependencies(edges: ExtensionGraphEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach((edge) => {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, []);
      }
      adjacencyList.get(edge.from)!.push(edge.to);
    });

    // DFS to detect cycles
    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      });

      recursionStack.delete(node);
    };

    // Check all nodes
    adjacencyList.forEach((_, node) => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    return cycles;
  }

  validateDependencies(extensionId: string): ExtensionDependencyValidation {
    const manifest = this.extensions.get(extensionId);
    if (!manifest) {
      throw new Error(`Extension ${extensionId} is not registered`);
    }

    const validation: ExtensionDependencyValidation = {
      valid: true,
      missingDependencies: [],
      versionConflicts: [],
      circularDependencies: [],
    };

    // Check for missing dependencies
    manifest.config.dependencies.forEach((dep) => {
      if (!dep.optional && !this.has(dep.id)) {
        validation.missingDependencies.push(dep.id);
        validation.valid = false;
      }
    });

    // Check for version conflicts
    manifest.config.dependencies.forEach((dep) => {
      const depManifest = this.get(dep.id);
      if (depManifest && !this.isVersionCompatible(dep.version, depManifest.config.version)) {
        validation.versionConflicts.push({
          dependencyId: dep.id,
          requiredVersion: dep.version,
          availableVersion: depManifest.config.version,
        });
        validation.valid = false;
      }
    });

    // Check for circular dependencies
    const graph = this.getDependencyGraph();
    const circularDeps = graph.cycles.find((cycle) => cycle.includes(extensionId));
    if (circularDeps) {
      validation.circularDependencies = circularDeps;
      validation.valid = false;
    }

    return validation;
  }

  private isVersionCompatible(requiredVersion: string, availableVersion: string): boolean {
    // Simple placeholder: assume compatible if versions match
    // In a real scenario, this would involve semantic versioning comparison
    return requiredVersion === availableVersion;
  }



  /**
   * Get extensions that depend on a specific extension
   */
  getDependents(extensionId: string): ExtensionManifest[] {
    return this.getAll().filter((ext) =>
      ext.config.dependencies.some((dep) => dep.id === extensionId)
    );
  }

  /**
   * Get extensions that a specific extension depends on
   */
  getDependencies(extensionId: string): ExtensionManifest[] {
    const manifest = this.extensions.get(extensionId);
    if (!manifest) {
      return [];
    }

    return manifest.config.dependencies
      .map((dep) => this.get(dep.id))
      .filter((ext): ext is ExtensionManifest => ext !== undefined);
  }

  /**
   * Get registry statistics grouped by various dimensions
   */
  getDetailedMetrics() {
    return {
      basic: this.getMetrics(),
      categories: this.getCategoryStats(),
      dependencies: this.getDependencyStats(),
      health: this.getHealthStats(),
      timeline: this.getTimelineStats(),
    };
  }

  private getCategoryStats() {
    const stats: Record<string, number> = {};
    this.categoryIndex.forEach((extensions, category) => {
      stats[category] = extensions.size;
    });
    return stats;
  }

  private getDependencyStats() {
    const extensions = this.getAll();
    const totalDeps = extensions.reduce((sum, ext) => sum + ext.config.dependencies.length, 0);

    return {
      totalDependencies: totalDeps,
      averageDependencies: extensions.length > 0 ? totalDeps / extensions.length : 0,
      extensionsWithNoDeps: extensions.filter((ext) => ext.config.dependencies.length === 0).length,
      mostDependentExtension: extensions.length > 0
        ? extensions.reduce((max, ext) =>
          ext.config.dependencies.length > max.config.dependencies.length ? ext : max
        ).config.id
        : undefined,
    };
  }

  private getHealthStats() {
    const extensions = this.getAll();
    const healthy = extensions.filter((ext) =>
      ext.status === ExtensionStatus.ACTIVE && !ext.errors?.length
    );

    return {
      healthyExtensions: healthy.length,
      healthPercentage: extensions.length > 0 ? (healthy.length / extensions.length) * 100 : 0,
      extensionsWithErrors: extensions.filter((ext) => ext.errors && ext.errors.length > 0).length,
      totalErrors: extensions.reduce((sum, ext) => sum + (ext.errors?.length || 0), 0),
    };
  }

  private getTimelineStats() {
    const extensions = this.getAll().filter((ext) => ext.loadedAt);

    if (extensions.length === 0) {
      return { oldestExtension: null, newestExtension: null, averageAge: 0 };
    }

    const oldest = extensions.reduce((min, ext) => ext.loadedAt! < min.loadedAt! ? ext : min);

    const newest = extensions.reduce((max, ext) => ext.loadedAt! > max.loadedAt! ? ext : max);

    const now = Date.now();
    const averageAge = extensions.reduce((sum, ext) => sum + (now - ext.loadedAt!.getTime()), 0) /
      extensions.length;

    return {
      oldestExtension: oldest.config.id,
      newestExtension: newest.config.id,
      averageAge: Math.round(averageAge / (1000 * 60 * 60 * 24)), // days
    };
  }
}
