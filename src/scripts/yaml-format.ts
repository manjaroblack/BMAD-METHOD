#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * YAML Formatter and Linter for BMAD-Method
 * Formats and validates YAML files and YAML embedded in Markdown
 * Migrated from Node.js to Deno
 */

import {
  basename,
  blue,
  bold,
  Command,
  cyan,
  expandGlob,
  extname,
  gray,
  green,
  magenta,
  parseYaml,
  red,
  Deno.stat,
  stringifyYaml,
  yellow,
} from "deps";

// Create colors object for compatibility
const colors = { blue, bold, cyan, gray, green, magenta, red, yellow };

// Interfaces
interface YamlFormatOptions {
  files: string[];
  help?: boolean;
}

interface ProcessingResult {
  changed: boolean;
  hasErrors: boolean;
}

interface ReplacementInfo {
  start: number;
  end: number;
  replacement: string;
}

/**
 * YAML Formatter and Linter class
 */
class YamlFormatter {
  private filesProcessed: string[] = [];
  private hasErrors = false;
  private hasChanges = false;

  /**
   * Format YAML content with automatic fixes
   */
  formatYamlContent(content: string, filename: string): string | null {
    try {
      // First try to fix common YAML issues
      let fixedContent = content
        // Fix "commands :" -> "commands:"
        .replace(/^(\s*)(\w+)\s+:/gm, "$1$2:")
        // Fix inconsistent list indentation
        .replace(/^(\s*)-\s{3,}/gm, "$1- ");

      // Skip auto-fixing for .roomodes files - they have special nested structure
      if (!filename.includes(".roomodes")) {
        fixedContent = fixedContent
          // Fix unquoted list items that contain special characters or multiple parts
          .replace(/^(\s*)-\s+(.*)$/gm, (match, indent, content) => {
            // Skip if already quoted
            if (content.startsWith('"') && content.endsWith('"')) {
              return match;
            }
            // If the content contains special YAML characters or looks complex, quote it
            // BUT skip if it looks like a proper YAML key-value pair (like "key: value")
            if (
              (content.includes(":") || content.includes("-") ||
                content.includes("{") || content.includes("}")) &&
              !content.match(/^\w+:\s/)
            ) {
              // Remove any existing quotes first, escape internal quotes, then add proper quotes
              const cleanContent = content.replace(/^["']|["']$/g, "").replace(
                /"/g,
                '\\"',
              );
              return `${indent}- "${cleanContent}"`;
            }
            return match;
          });
      }

      // Debug: show what we're trying to parse
      if (fixedContent !== content) {
        console.log(colors.blue(`🔧 Applied YAML fixes to ${filename}`));
      }

      // Parse and re-dump YAML to format it
      const parsed = parseYaml(fixedContent) as Record<string, unknown>;
      const formatted = stringifyYaml(parsed, {
        indent: 2,
        lineWidth: -1, // Disable line wrapping
        sortKeys: false, // Preserve key order
      });
      return formatted;
    } catch (error) {
      console.error(
        colors.red(`❌ YAML syntax error in ${filename}:`),
        (error as Error).message,
      );
      console.error(
        colors.yellow(`💡 Try manually fixing the YAML structure first`),
      );
      return null;
    }
  }

  /**
   * Process Markdown file with YAML code blocks
   */
  async processMarkdownFile(filePath: string): Promise<boolean> {
    const content = await Deno.readTextFile(filePath);
    let modified = false;
    let newContent = content;

    // Fix untyped code blocks by adding 'text' type
    // Match ``` at start of line followed by newline, but only if it's an opening fence
    newContent = newContent.replace(
      /^```\n([\s\S]*?)\n```$/gm,
      "```text\n$1\n```",
    );
    if (newContent !== content) {
      modified = true;
      console.log(
        colors.blue(`🔧 Added 'text' type to untyped code blocks in ${filePath}`),
      );
    }

    // Find YAML code blocks
    const yamlBlockRegex = /```ya?ml\n([\s\S]*?)\n```/g;
    let match;
    const replacements: ReplacementInfo[] = [];

    while ((match = yamlBlockRegex.exec(newContent)) !== null) {
      const [fullMatch, yamlContent] = match;
      const matchIndex = match.index;

      if (matchIndex === undefined || yamlContent === undefined) continue;

      const formatted = await this.formatYamlContent(yamlContent, filePath);
      if (formatted !== null) {
        // Remove trailing newline that yaml stringify adds
        const trimmedFormatted = formatted.replace(/\n$/, "");

        if (trimmedFormatted !== yamlContent) {
          modified = true;
          console.log(colors.green(`✓ Formatted YAML in ${filePath}`));
        }

        replacements.push({
          start: matchIndex,
          end: matchIndex + fullMatch.length,
          replacement: `\`\`\`yaml\n${trimmedFormatted}\n\`\`\``,
        });
      }
    }

    // Apply replacements in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const replacement = replacements[i];
      if (replacement) {
        const { start, end, replacement: replacementText } = replacement;
        newContent = newContent.slice(0, start) + replacementText +
          newContent.slice(end);
      }
    }

    if (modified) {
      await Deno.writeTextFile(filePath, newContent);
      return true;
    }
    return false;
  }

  /**
   * Process standalone YAML file
   */
  async processYamlFile(filePath: string): Promise<boolean> {
    const content = await Deno.readTextFile(filePath);
    const formatted = await this.formatYamlContent(content, filePath);

    if (formatted === null) {
      return false; // Syntax error
    }

    if (formatted !== content) {
      await Deno.writeTextFile(filePath, formatted);
      return true;
    }
    return false;
  }

  /**
   * Lint YAML file using Deno's built-in YAML parser
   */
  async lintYamlFile(filePath: string): Promise<boolean> {
    try {
      const content = await Deno.readTextFile(filePath);
      parseYaml(content); // This will throw if invalid
      return true;
    } catch (error) {
      console.error(colors.red(`❌ YAML lint error in ${filePath}:`));
      console.error((error as Error).message);
      return false;
    }
  }

  /**
   * Expand glob patterns to file paths
   */
  async expandGlobPatterns(patterns: string[]): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        // It's a glob pattern
        try {
          for await (const entry of expandGlob(pattern)) {
            if (entry.isFile) {
              allFiles.push(entry.path);
            }
          }
        } catch {
          // Ignore glob expansion errors
        }
      } else {
        // It's a direct file path
        allFiles.push(pattern);
      }
    }

    return allFiles;
  }

  /**
   * Process a single file based on its type
   */
  async processFile(filePath: string): Promise<ProcessingResult> {
    if (!(await Deno.stat(filePath))) {
      return { changed: false, hasErrors: false };
    }

    const ext = extname(filePath).toLowerCase();
    const base = basename(filePath).toLowerCase();

    try {
      let changed = false;
      let hasErrors = false;

      if (ext === ".md") {
        changed = await this.processMarkdownFile(filePath);
      } else if (
        ext === ".yaml" || ext === ".yml" || base.includes("roomodes") ||
        base.includes(".yaml") || base.includes(".yml")
      ) {
        // Handle YAML files and special cases like .roomodes
        changed = await this.processYamlFile(filePath);

        // Also run linting
        const lintPassed = await this.lintYamlFile(filePath);
        if (!lintPassed) hasErrors = true;
      } else {
        // Skip silently for unsupported files
        return { changed: false, hasErrors: false };
      }

      if (changed) {
        this.filesProcessed.push(filePath);
      }

      return { changed, hasErrors };
    } catch (error) {
      console.error(
        colors.red(`❌ Error processing ${filePath}:`),
        (error as Error).message,
      );
      return { changed: false, hasErrors: true };
    }
  }

  /**
   * Format multiple files
   */
  async formatFiles(filePatterns: string[]): Promise<void> {
    if (filePatterns.length === 0) {
      console.error("Usage: yaml-format <file1> [file2] ...");
      console.error("Use --help for more information.");
      Deno.exit(1);
    }

    this.hasErrors = false;
    this.hasChanges = false;
    this.filesProcessed = [];

    // Expand glob patterns and collect all files
    const allFiles = await this.expandGlobPatterns(filePatterns);

    for (const filePath of allFiles) {
      const result = await this.processFile(filePath);

      if (result.changed) {
        this.hasChanges = true;
      }

      if (result.hasErrors) {
        this.hasErrors = true;
      }
    }

    // Display results
    if (this.hasChanges) {
      console.log(
        colors.green(
          `\n✨ YAML formatting completed! Modified ${this.filesProcessed.length} files:`,
        ),
      );
      this.filesProcessed.forEach((file) => console.log(colors.blue(`  📝 ${file}`)));
    }

    if (this.hasErrors) {
      console.error(
        colors.red(
          "\n💥 Some files had errors. Please fix them before committing.",
        ),
      );
      Deno.exit(1);
    }
  }

  /**
   * Display help information
   */
  displayHelp(): void {
    console.log(`
YAML Formatter and Linter for BMAD-Method

Usage: yaml-format <file1> [file2] ...

Options:
  --help, -h    Show this help message

Examples:
  yaml-format config.yaml
  yaml-format **/*.yaml
  yaml-format file1.yml file2.md

Supported files:
  - .yaml, .yml files
  - .md files with YAML frontmatter or code blocks
  - .roomodes files
`);
  }
}

// CLI setup
const program = new Command()
  .name("yaml-format")
  .description("YAML Formatter and Linter for BMAD-Method")
  .version("1.0.0")
  .arguments("<files...>")
  .action(async (_options, ...files: string[]) => {
    const formatter = new YamlFormatter();
    await formatter.formatFiles(files);
  })
  .option("-h, --help", "Show help information", {
    action: () => {
      const formatter = new YamlFormatter();
      formatter.displayHelp();
      Deno.exit(0);
    },
  });

if (import.meta.main) {
  await program.parse(Deno.args);
}

export { YamlFormatter };
export type { ProcessingResult, YamlFormatOptions };
