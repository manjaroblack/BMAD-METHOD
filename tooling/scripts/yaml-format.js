#!/usr/bin/env node

import process from "node:process";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { execSync } from "child_process";
import { glob } from "glob";

// Dynamic import for ES module
let chalk;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
  }
}

/**
 * YAML Formatter and Linter for BMad-Method
 * Formats and validates YAML files and YAML embedded in Markdown
 */

async function formatYamlContent(content, filename) {
  await initializeModules();
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
      console.log(chalk.blue(`🔧 Applied YAML fixes to ${filename}`));
    }

    // Parse and re-dump YAML to format it
    const parsed = yaml.load(fixedContent);
    const formatted = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1, // Disable line wrapping
      noRefs: true,
      sortKeys: false, // Preserve key order
    });
    return formatted;
  } catch (error) {
    console.error(
      chalk.red(`❌ YAML syntax error in ${filename}:`),
      error.message,
    );
    console.error(
      chalk.yellow(`💡 Try manually fixing the YAML structure first`),
    );
    return null;
  }
}

async function processMarkdownFile(filePath) {
  await initializeModules();
  const content = fs.readFileSync(filePath, "utf8");
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
      chalk.blue(`🔧 Added 'text' type to untyped code blocks in ${filePath}`),
    );
  }

  // Find YAML code blocks
  const yamlBlockRegex = /```ya?ml\n([\s\S]*?)\n```/g;
  let match;
  const replacements = [];

  while ((match = yamlBlockRegex.exec(newContent)) !== null) {
    const [fullMatch, yamlContent] = match;
    const formatted = await formatYamlContent(yamlContent, filePath);
    if (formatted !== null) {
      // Remove trailing newline that js-yaml adds
      const trimmedFormatted = formatted.replace(/\n$/, "");

      if (trimmedFormatted !== yamlContent) {
        modified = true;
        console.log(chalk.green(`✓ Formatted YAML in ${filePath}`));
      }

      replacements.push({
        start: match.index,
        end: match.index + fullMatch.length,
        replacement: `\`\`\`yaml\n${trimmedFormatted}\n\`\`\``,
      });
    }
  }

  // Apply replacements in reverse order to maintain indices
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i];
    newContent = newContent.slice(0, start) + replacement +
      newContent.slice(end);
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  return false;
}

async function processYamlFile(filePath) {
  await initializeModules();
  const content = fs.readFileSync(filePath, "utf8");
  const formatted = await formatYamlContent(content, filePath);

  if (formatted === null) {
    return false; // Syntax error
  }

  if (formatted !== content) {
    fs.writeFileSync(filePath, formatted);
    return true;
  }
  return false;
}

async function lintYamlFile(filePath) {
  await initializeModules();
  try {
    // Use yaml-lint for additional validation
    execSync(`npx yaml-lint "${filePath}"`, { stdio: "pipe" });
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ YAML lint error in ${filePath}:`));
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

async function main() {
  await initializeModules();
  const args = process.argv.slice(2);

  // Handle help and other options
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
YAML Formatter and Linter for BMad-Method

Usage: node yaml-format.js <file1> [file2] ...

Options:
  --help, -h    Show this help message

Examples:
  node yaml-format.js config.yaml
  node yaml-format.js **/*.yaml
  node yaml-format.js file1.yml file2.md

Supported files:
  - .yaml, .yml files
  - .md files with YAML frontmatter or code blocks
  - .roomodes files
`);
    process.exit(0);
  }

  // Filter out option flags from file arguments
  const fileArgs = args.filter(arg => !arg.startsWith('-'));

  if (fileArgs.length === 0) {
    console.error("Usage: node yaml-format.js <file1> [file2] ...");
    console.error("Use --help for more information.");
    process.exit(1);
  }

  let hasErrors = false;
  let hasChanges = false;
  const filesProcessed = [];

  // Expand glob patterns and collect all files
  const allFiles = [];
  for (const arg of fileArgs) {
    if (arg.includes("*")) {
      // It's a glob pattern
      const matches = await glob(arg);
      allFiles.push(...matches);
    } else {
      // It's a direct file path
      allFiles.push(arg);
    }
  }

  for (const filePath of allFiles) {
    if (!fs.existsSync(filePath)) {
      // Skip silently for glob patterns that don't match anything
      if (!fileArgs.some((arg) => arg.includes("*") && filePath === arg)) {
        console.error(chalk.red(`❌ File not found: ${filePath}`));
        hasErrors = true;
      }
      continue;
    }

    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    try {
      let changed = false;
      if (ext === ".md") {
        changed = await processMarkdownFile(filePath);
      } else if (
        ext === ".yaml" || ext === ".yml" || basename.includes("roomodes") ||
        basename.includes(".yaml") || basename.includes(".yml")
      ) {
        // Handle YAML files and special cases like .roomodes
        changed = await processYamlFile(filePath);

        // Also run linting
        const lintPassed = await lintYamlFile(filePath);
        if (!lintPassed) hasErrors = true;
      } else {
        // Skip silently for unsupported files
        continue;
      }

      if (changed) {
        hasChanges = true;
        filesProcessed.push(filePath);
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error processing ${filePath}:`),
        error.message,
      );
      hasErrors = true;
    }
  }

  if (hasChanges) {
    console.log(
      chalk.green(
        `\n✨ YAML formatting completed! Modified ${filesProcessed.length} files:`,
      ),
    );
    filesProcessed.forEach((file) => console.log(chalk.blue(`  📝 ${file}`)));
  }

  if (hasErrors) {
    console.error(
      chalk.red(
        "\n💥 Some files had errors. Please fix them before committing.",
      ),
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  });
}

export { formatYamlContent, processMarkdownFile, processYamlFile };