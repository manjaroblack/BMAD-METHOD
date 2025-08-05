#!/usr/bin/env -S deno run --allow-read --allow-write

import { basename, Command, extname, join, relative, walk } from "deps";

interface FileInfo {
  path: string;
  content: string;
  size: number;
  type: string;
}

interface Statistics {
  totalFiles: number;
  totalSize: number;
  xmlFileSize: number;
  largestFile: { path: string; size: number };
  fileTypes: Record<string, number>;
}

/**
 * Recursively discover all files in a directory
 * @param rootDir - The root directory to scan
 * @returns Array of file paths
 */
async function discoverFiles(rootDir: string): Promise<string[]> {
  try {
    const gitignorePath = join(rootDir, ".gitignore");
    const gitignorePatterns = await parseGitignore(gitignorePath);

    // Common gitignore patterns that should always be ignored
    const commonIgnorePatterns = [
      // Version control
      ".git/**",
      ".svn/**",
      ".hg/**",
      ".bzr/**",

      // Dependencies
      "node_modules/**",
      "bower_components/**",
      "vendor/**",
      "packages/**",

      // Build outputs
      "build/**",
      "dist/**",
      "out/**",
      "target/**",
      "bin/**",
      "obj/**",
      "release/**",
      "debug/**",

      // Environment and config
      ".env",
      ".env.*",
      "*.env",
      ".config",

      // Cache and temporary
      ".cache/**",
      "tmp/**",
      "temp/**",
      "*.tmp",
      "*.temp",
      ".bmad-cache/**",

      // IDE and editor files
      ".vscode/**",
      ".idea/**",
      "*.swp",
      "*.swo",
      "*~",
      ".DS_Store",
      "Thumbs.db",

      // Logs
      "*.log",
      "logs/**",

      // Archives
      "*.zip",
      "*.tar",
      "*.tar.gz",
      "*.rar",
      "*.7z",

      // Media files
      "*.jpg",
      "*.jpeg",
      "*.png",
      "*.gif",
      "*.bmp",
      "*.ico",
      "*.svg",
      "*.mp3",
      "*.mp4",
      "*.avi",
      "*.mov",
      "*.wmv",
      "*.flv",
      "*.webm",

      // Documents
      "*.pdf",
      "*.doc",
      "*.docx",
      "*.xls",
      "*.xlsx",
      "*.ppt",
      "*.pptx",

      // Fonts
      "*.ttf",
      "*.otf",
      "*.woff",
      "*.woff2",
      "*.eot",

      // Executables
      "*.exe",
      "*.dll",
      "*.so",
      "*.dylib",
      "*.app",

      // Flattener specific outputs
      "flattened-codebase.xml",
      "*-flattened.xml",
    ];

    const allPatterns = [...commonIgnorePatterns, ...gitignorePatterns];
    const files: string[] = [];

    for await (const entry of walk(rootDir, { includeFiles: true, includeDirs: false })) {
      const relativePath = relative(rootDir, entry.path);

      // Check if file should be ignored
      const shouldIgnore = allPatterns.some((pattern) => {
        return minimatch(relativePath, pattern) || minimatch(entry.path, pattern);
      });

      if (!shouldIgnore) {
        files.push(entry.path);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error discovering files: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Parse .gitignore file and return patterns
 * @param gitignorePath - Path to .gitignore file
 * @returns Array of gitignore patterns
 */
async function parseGitignore(gitignorePath: string): Promise<string[]> {
  try {
    if (!(await Deno.stat(gitignorePath))) {
      return [];
    }

    const content = await Deno.readTextFile(gitignorePath);
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.endsWith("/") ? `${line}**` : line);
  } catch (error) {
    console.warn(`Warning: Could not parse .gitignore: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Check if a file is binary
 * @param filePath - Path to the file
 * @returns True if file is binary
 */
async function isBinaryFile(filePath: string): Promise<boolean> {
  try {
    const buffer = new Uint8Array(512);
    const file = await Deno.open(filePath, { read: true });
    const bytesRead = await file.read(buffer);
    file.close();

    if (!bytesRead) return false;

    // Check for null bytes (common in binary files)
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }

    // Check for high percentage of non-printable characters
    let nonPrintable = 0;
    for (let i = 0; i < bytesRead; i++) {
      const byte = buffer[i];
      if (byte !== undefined && byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        nonPrintable++;
      }
    }

    return (nonPrintable / bytesRead) > 0.3;
  } catch {
    return true; // Assume binary if we can't read it
  }
}

/**
 * Simple minimatch implementation for Deno
 */
function minimatch(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
    .replace(/\*\*/g, ".*");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Aggregate file contents
 * @param files - Array of file paths
 * @param rootDir - Root directory
 * @param spinner - Optional spinner for progress
 * @returns Array of file information
 */
async function aggregateFileContents(
  files: string[],
  rootDir: string,
  spinner?: unknown,
): Promise<FileInfo[]> {
  const aggregatedContent: FileInfo[] = [];
  let processedCount = 0;

  for (const filePath of files) {
    try {
      if (spinner && typeof spinner === "object" && spinner !== null && "message" in spinner) {
        (spinner as { message: string }).message = `Processing: ${basename(filePath)} (${
          processedCount + 1
        }/${files.length})`;
      }

      const isBinary = await isBinaryFile(filePath);
      if (isBinary) {
        console.log(`Skipping binary file: ${relative(rootDir, filePath)}`);
        continue;
      }

      const content = await Deno.readTextFile(filePath);
      const stats = await Deno.stat(filePath);
      const relativePath = relative(rootDir, filePath);
      const fileType = extname(filePath).slice(1) || "no-extension";

      aggregatedContent.push({
        path: relativePath,
        content,
        size: stats.size,
        type: fileType,
      });

      processedCount++;
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${(error as Error).message}`);
    }
  }

  return aggregatedContent;
}

/**
 * Generate XML output
 * @param aggregatedContent - Array of file information
 * @param outputPath - Output file path
 */
async function generateXMLOutput(
  aggregatedContent: FileInfo[],
  outputPath: string,
): Promise<void> {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<codebase>\n`;
  const xmlFooter = `</codebase>\n`;

  let xmlContent = xmlHeader;

  // Add metadata
  xmlContent += `  <metadata>\n`;
  xmlContent += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xmlContent += `    <total_files>${aggregatedContent.length}</total_files>\n`;
  xmlContent += `    <generator>BMad-Method Flattener v1.0.0</generator>\n`;
  xmlContent += `  </metadata>\n\n`;

  // Add files
  xmlContent += `  <files>\n`;
  for (const file of aggregatedContent) {
    xmlContent += `    <file>\n`;
    xmlContent += `      <path>${escapeXml(file.path)}</path>\n`;
    xmlContent += `      <type>${escapeXml(file.type)}</type>\n`;
    xmlContent += `      <size>${file.size}</size>\n`;
    xmlContent += `      <content>\n`;
    xmlContent += splitAndWrapCDATA(indentFileContent(file.content));
    xmlContent += `      </content>\n`;
    xmlContent += `    </file>\n\n`;
  }
  xmlContent += `  </files>\n`;

  xmlContent += xmlFooter;

  await Deno.writeTextFile(outputPath, xmlContent);
}

/**
 * Escape XML special characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Indent file content for XML
 * @param content - File content
 * @returns Indented content
 */
function indentFileContent(content: string): string {
  return content
    .split("\n")
    .map((line) => `        ${line}`)
    .join("\n");
}

/**
 * Split and wrap content in CDATA
 * @param content - Content to wrap
 * @returns CDATA wrapped content
 */
function splitAndWrapCDATA(content: string): string {
  const cdataStart = "        <![CDATA[\n";
  const cdataEnd = "\n        ]]>\n";
  return cdataStart + content + cdataEnd;
}

/**
 * Calculate statistics
 * @param aggregatedContent - Array of file information
 * @param xmlFileSize - Size of generated XML file
 * @returns Statistics object
 */
function calculateStatistics(
  aggregatedContent: FileInfo[],
  xmlFileSize: number,
): Statistics {
  const totalFiles = aggregatedContent.length;
  const totalSize = aggregatedContent.reduce((sum, file) => sum + file.size, 0);

  const largestFile = aggregatedContent.reduce(
    (largest, file) => (file.size > largest.size ? file : largest),
    { path: "", size: 0 },
  );

  const fileTypes: Record<string, number> = {};
  for (const file of aggregatedContent) {
    fileTypes[file.type] = (fileTypes[file.type] || 0) + 1;
  }

  return {
    totalFiles,
    totalSize,
    xmlFileSize,
    largestFile,
    fileTypes,
  };
}

/**
 * Filter files based on patterns
 * @param files - Array of file paths
 * @param rootDir - Root directory
 * @returns Filtered array of file paths
 */
async function filterFiles(files: string[], _rootDir: string): Promise<string[]> {
  const filtered: string[] = [];

  for (const file of files) {
    try {
      const stats = await Deno.stat(file);
      if (stats.isFile) {
        // Additional filtering can be added here
        filtered.push(file);
      }
    } catch {
      // Skip files that can't be accessed
    }
  }

  return filtered;
}

// Main CLI setup
const program = new Command()
  .name("bmad-flatten")
  .description("BMad-Method codebase flattener tool")
  .version("1.0.0")
  .option("-i, --input <path>", "Input directory to flatten", { default: Deno.cwd() })
  .option("-o, --output <path>", "Output file path", { default: "flattened-codebase.xml" })
  .action(async (options) => {
    const input = options.input || Deno.cwd();
    const output = options.output || "flattened-codebase.xml";

    console.log("🔍 BMad-Method Codebase Flattener");
    console.log(`📁 Input directory: ${input}`);
    console.log(`📄 Output file: ${output}`);
    console.log("");

    try {
      // Discover files
      console.log("🔍 Discovering files...");
      const allFiles = await discoverFiles(input);
      console.log(`📊 Found ${allFiles.length} files to process`);

      if (allFiles.length === 0) {
        console.log("❌ No files found to process");
        Deno.exit(1);
      }

      // Filter files
      const files = await filterFiles(allFiles, input);
      console.log(`✅ ${files.length} files after filtering`);

      // Process files
      console.log("📝 Processing files...");
      const aggregatedContent = await aggregateFileContents(files, input);

      // Generate XML
      console.log("🔧 Generating XML output...");
      await generateXMLOutput(aggregatedContent, output);

      // Calculate statistics
      const xmlStats = await Deno.stat(output);
      const statistics = calculateStatistics(aggregatedContent, xmlStats.size);

      // Display results
      console.log("");
      console.log("✅ Flattening completed successfully!");
      console.log("");
      console.log("📊 Statistics:");
      console.log(`   📁 Total files processed: ${statistics.totalFiles}`);
      console.log(`   📏 Total source size: ${(statistics.totalSize / 1024).toFixed(2)} KB`);
      console.log(`   📄 XML output size: ${(statistics.xmlFileSize / 1024).toFixed(2)} KB`);
      console.log(
        `   📈 Largest file: ${statistics.largestFile.path} (${
          (statistics.largestFile.size / 1024).toFixed(2)
        } KB)`,
      );
      console.log("");
      console.log("📋 File types:");
      for (const [type, count] of Object.entries(statistics.fileTypes)) {
        console.log(`   ${type}: ${count} files`);
      }
      console.log("");
      console.log(`💾 Output saved to: ${output}`);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      Deno.exit(1);
    }
  });

if (import.meta.main) {
  await program.parse(Deno.args);
}

export default program;
