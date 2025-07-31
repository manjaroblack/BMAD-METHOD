import {
  basename,
  CacheManager,
  DependencyResolver,
  exists,
  join,
  ParallelProcessor,
  parseYaml,
  PerformanceMonitor,
  relative,
  SEPARATOR as sep,
} from "deps";

interface WebBuilderOptions {
  rootDir?: string;
  outputDirs?: string[];
  enableCache?: boolean;
  enableParallel?: boolean;
}

interface BuildOptions {
  clean?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class WebBuilder {
  private rootDir: string;
  private outputDirs: string[];
  private resolver: DependencyResolver;
  private templatePath: string;
  private cache: CacheManager;
  private processor: ParallelProcessor;
  private monitor: PerformanceMonitor;
  private enableCache: boolean;
  private enableParallel: boolean;

  constructor(options: WebBuilderOptions = {}) {
    this.rootDir = options.rootDir || Deno.cwd();
    this.outputDirs = options.outputDirs || [join(this.rootDir, "dist")];
    this.resolver = new DependencyResolver(this.rootDir);
    this.templatePath = join(
      this.rootDir,
      "tooling",
      "md-assets",
      "web-agent-startup-instructions.md",
    );

    // Performance optimization components
    this.cache = new CacheManager(join(this.rootDir, ".bmad-cache", "web-builder"));
    this.processor = new ParallelProcessor();
    this.monitor = new PerformanceMonitor();
    this.enableCache = options.enableCache !== false;
    this.enableParallel = options.enableParallel !== false;
  }

  // Cached file reading with performance monitoring
  async readFileWithCache(filePath: string): Promise<string> {
    if (!this.enableCache) {
      return await Deno.readTextFile(filePath);
    }

    const cacheKey = this.cache.generateKey(filePath, "file_");
    let content = this.cache.get(cacheKey);

    if (content === null) {
      const operationId = this.monitor.start(`read_${basename(filePath)}`);
      content = await Deno.readTextFile(filePath);
      this.cache.set(cacheKey, content);
      this.monitor.end(operationId);
    }

    return content as string;
  }

  // Cached YAML parsing
  async parseYamlFile(filePath: string): Promise<unknown> {
    if (!this.enableCache) {
      const content = await Deno.readTextFile(filePath);
      return parseYaml(content);
    }

    const cacheKey = this.cache.generateKey(filePath, "yaml_");
    let parsed = this.cache.get(cacheKey);

    if (parsed === null) {
      const operationId = this.monitor.start(`parse_yaml_${basename(filePath)}`);
      const content = await this.readFileWithCache(filePath);
      parsed = parseYaml(content);
      this.cache.set(cacheKey, parsed);
      this.monitor.end(operationId);
    }

    return parsed;
  }

  // Parallel file processing
  async processFilesInParallel<T>(
    filePaths: string[],
    processor: (filePath: string) => Promise<T>,
  ): Promise<T[]> {
    if (!this.enableParallel || filePaths.length < 4) {
      // Process sequentially for small batches
      const results: T[] = [];
      for (const filePath of filePaths) {
        results.push(await processor(filePath));
      }
      return results;
    }

    return await this.processor.processInParallel(filePaths, processor);
  }

  convertToWebPath(filePath: string, bundleRoot = ".bmad-core"): string {
    // Convert absolute paths to web bundle paths with dot prefix
    // All resources get installed under the bundle root, so use that path
    const relativePath = relative(this.rootDir, filePath);
    const pathParts = relativePath.split(sep);

    let resourcePath: string;
    if (pathParts[0] === "expansion-packs") {
      // For expansion packs, remove 'expansion-packs/packname' and use the rest
      resourcePath = pathParts.slice(2).join("/");
    } else {
      // For bmad-core, common, etc., remove the first part
      resourcePath = pathParts.slice(1).join("/");
    }

    return `${bundleRoot}/${resourcePath}`;
  }

  generateWebInstructions(packName: string | null = null): string {
    // Generate web-specific instructions for agent startup
    const bundleRoot = packName ? `.bmad-${packName}` : ".bmad-core";

    return `# BMad-Method Web Bundle Instructions\n\n` +
      `This bundle contains agents and teams for web deployment.\n` +
      `Bundle root: ${bundleRoot}\n\n` +
      `## Usage\n\n` +
      `Load agents and teams from the bundle directory structure.\n`;
  }

  async cleanOutputDirs(): Promise<void> {
    for (const outputDir of this.outputDirs) {
      try {
        if (await exists(outputDir)) {
          await Deno.remove(outputDir, { recursive: true });
        }
      } catch (error) {
        console.warn(`Failed to clean ${outputDir}:`, (error as Error).message);
      }
    }
  }

  async buildAgents(): Promise<void> {
    const agents = await this.listAgents();

    await this.processFilesInParallel(agents, async (agentId) => {
      try {
        await this.buildAgentBundle(agentId);
        console.log(`✅ Built agent: ${agentId}`);
      } catch (error) {
        console.error(`❌ Failed to build agent ${agentId}:`, (error as Error).message);
        throw error;
      }
    });
  }

  async buildTeams(): Promise<void> {
    const teams = await this.listTeams();

    await this.processFilesInParallel(teams, async (teamId) => {
      try {
        await this.buildTeamBundle(teamId);
        console.log(`✅ Built team: ${teamId}`);
      } catch (error) {
        console.error(`❌ Failed to build team ${teamId}:`, (error as Error).message);
        throw error;
      }
    });
  }

  buildAgentBundle(agentId: string): void {
    // Implementation placeholder
    console.log(`Building agent bundle: ${agentId}`);
  }

  buildTeamBundle(teamId: string): void {
    // Implementation placeholder - will be expanded
    console.log(`Building team bundle: ${teamId}`);
  }

  buildAllExpansionPacks(_options: BuildOptions = {}): void {
    const expansions = this.listExpansionPacks();

    for (const expansion of expansions) {
      this.buildExpansionPack(expansion, _options);
    }
  }

  buildExpansionPack(packName: string, _options: BuildOptions = {}): void {
    console.log(`Building expansion pack: ${packName}`);
    // Implementation placeholder - will be expanded
  }

  validateAgents(): ValidationResult {
    return { valid: true, errors: [] };
  }

  validateTeams(): ValidationResult {
    return { valid: true, errors: [] };
  }

  validateExpansionPacks(): ValidationResult {
    return { valid: true, errors: [] };
  }

  listAgents(): string[] {
    // Implementation placeholder
    return [];
  }

  listTeams(): string[] {
    // Implementation placeholder
    return [];
  }

  listExpansionPacks(): string[] {
    // Implementation placeholder
    return [];
  }
}
