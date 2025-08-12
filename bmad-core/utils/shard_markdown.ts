/**
 * Markdown Sharder
 *
 * Splits a markdown file by top-level H2 sections (##) into individual files.
 * - Creates a destination folder (defaults to docs/<basename>)
 * - Writes index.md containing original H1 and intro (pre-first H2)
 * - For each H2 section, writes <kebab-case-title>.md with heading levels decreased by 1
 * - Preserves fenced code blocks and does not treat ## inside fences as headers
 * - Avoids adjusting headings that are inside fenced code blocks
 *
 * Usage:
 *   # Shard both PRD and Architecture from core-config (if both present)
 *   deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --all
 *   # or with no args if both are present in config
 *   deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts
 *
 *   # Shard only PRD or only Architecture from core-config
 *   deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --prd
 *   deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --arch
 *
 *   # Shard an arbitrary file (manual source/dest)
 *   deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts <source.md> [dest_dir]
 */

import { parseYaml, path } from "deps";

function basename(p: string): string {
  return path.basename(p);
}

if (import.meta.main) {
  try {
    const flags = parseFlags(Deno.args);
    const [posSrcArg, posDestArg] = parseArgs(Deno.args);
    const cfg = await tryLoadCoreConfig();

    // Help and unknown flags
    if (flags.help) {
      printUsageAndExit(0);
    }
    if (flags.unknown.length > 0) {
      console.error(`Unknown flag(s): ${flags.unknown.join(", ")}`);
      printUsageAndExit(1);
    }

    const targeted = Number(flags.all) + Number(flags.prd) + Number(flags.arch);
    if (targeted > 1) {
      console.error("Use only one of --all, --prd, or --arch.");
      printUsageAndExit(1);
    }
    if (posSrcArg && targeted > 0) {
      console.error(
        "Do not mix positional file args with --all/--prd/--arch flags.",
      );
      printUsageAndExit(1);
    }

    // If --all is set OR no args and both configs exist → shard both
    const hasPRD = !!(cfg?.prd?.prdFile && cfg?.prd?.prdShardedLocation);
    const hasArch = !!(
      cfg?.architecture?.architectureFile &&
      cfg?.architecture?.architectureShardedLocation
    );

    if (flags.all || (!posSrcArg && hasPRD && hasArch)) {
      const targets: { src: string; dest: string }[] = [];
      if (hasPRD && cfg?.prd) {
        targets.push({
          src: String(cfg.prd.prdFile),
          dest: String(cfg.prd.prdShardedLocation),
        });
      }
      if (hasArch && cfg?.architecture) {
        targets.push({
          src: String(cfg.architecture.architectureFile),
          dest: String(cfg.architecture.architectureShardedLocation),
        });
      }
      for (const t of targets) {
        await shardAndWrite(t.src, t.dest);
      }
      Deno.exit(0);
    }

    // If --prd or --arch explicitly → shard that from config
    if (flags.prd) {
      if (!cfg?.prd?.prdFile) {
        console.error("No PRD configuration found in bmad-core/core-config.yaml");
        Deno.exit(1);
      }
      const src = String(cfg.prd.prdFile);
      const dest = String(
        cfg.prd.prdShardedLocation ?? deriveDefaultDest(src),
      );
      await shardAndWrite(src, dest);
      Deno.exit(0);
    }
    if (flags.arch) {
      if (!cfg?.architecture?.architectureFile) {
        console.error(
          "No Architecture configuration found in bmad-core/core-config.yaml",
        );
        Deno.exit(1);
      }
      const src = String(cfg.architecture.architectureFile);
      const dest = String(
        cfg.architecture.architectureShardedLocation ?? deriveDefaultDest(src),
      );
      await shardAndWrite(src, dest);
      Deno.exit(0);
    }

    // Otherwise, fall back to single-run resolution (positional args or single configured entry)
    const { src, dest } = await resolveSrcAndDest(posSrcArg, posDestArg);
    await shardAndWrite(src, dest);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Shard failed:", message);
    Deno.exit(1);
  }
}

function parseArgs(args: string[]): [string | undefined, string | undefined] {
  const positional: string[] = [];
  for (const a of args) {
    if (a.startsWith("-")) continue; // no flags currently
    positional.push(a);
  }
  return [positional[0], positional[1]];
}

function parseFlags(args: string[]): {
  all: boolean;
  prd: boolean;
  arch: boolean;
  help: boolean;
  unknown: string[];
} {
  let all = false;
  let prd = false;
  let arch = false;
  let help = false;
  const unknown: string[] = [];
  for (const a of args) {
    if (!a.startsWith("-")) continue;
    if (a === "--all" || a === "-a") all = true;
    else if (a === "--prd" || a === "-p") prd = true;
    else if (a === "--arch" || a === "-r") arch = true;
    else if (a === "--help" || a === "-h") help = true;
    else unknown.push(a);
  }
  return { all, prd, arch, help, unknown };
}

function printUsageAndExit(code = 0): never {
  const usage = `
Usage:
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts [--help]
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts [--all|--prd|--arch]
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts <source.md> [dest_dir]

Description:
  Shard a markdown document into multiple files by top-level sections.
  - Auto-detects the split heading level (commonly H2)
  - Preserves fenced code blocks and formatting
  - Writes an index.md with the original H1 and intro content

Config-driven modes (via bmad-core/core-config.yaml):
  --all   Shard both PRD and Architecture (if both configured), or both when no args are passed and both exist
  --prd   Shard the PRD only (requires prd.prdFile and prd.prdShardedLocation)
  --arch  Shard the Architecture only (requires architecture.architectureFile and architecture.architectureShardedLocation)

Manual mode:
  Provide <source.md> and optional [dest_dir] to shard any file.

Examples:
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --all
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --prd
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts --arch
  deno run --allow-read --allow-write bmad-core/utils/shard_markdown.ts docs/prd.md docs/prd
`;
  console.log(usage.trimEnd());
  // deno-lint-ignore no-explicit-any
  Deno.exit(code as any);
}

type CoreConfig = {
  prd?: {
    prdFile?: string;
    prdShardedLocation?: string;
  };
  architecture?: {
    architectureFile?: string;
    architectureShardedLocation?: string;
  };
};

async function resolveSrcAndDest(
  srcArg?: string,
  destArg?: string,
): Promise<
  { src: string; dest: string; displaySrc: string; displayDest: string }
> {
  const cfg = await tryLoadCoreConfig();
  if (!srcArg) {
    if (cfg?.prd?.prdFile && cfg?.prd?.prdShardedLocation) {
      const src = String(cfg.prd.prdFile);
      const dest = String(cfg.prd.prdShardedLocation);
      const displaySrc = basename(src);
      const displayDest = path.isAbsolute(dest)
        ? dest
        : (dest.startsWith(".") ? dest : `./${dest}`);
      return { src, dest, displaySrc, displayDest };
    } else if (
      cfg?.architecture?.architectureFile &&
      cfg?.architecture?.architectureShardedLocation
    ) {
      const src = String(cfg.architecture.architectureFile);
      const dest = String(cfg.architecture.architectureShardedLocation);
      const displaySrc = basename(src);
      const displayDest = path.isAbsolute(dest)
        ? dest
        : (dest.startsWith(".") ? dest : `./${dest}`);
      return { src, dest, displaySrc, displayDest };
    }
    printUsageAndExit(1);
  }
  const src = srcArg;
  let dest = destArg ?? deriveDefaultDest(src);
  if (!destArg) {
    if (cfg?.prd?.prdFile === src && cfg?.prd?.prdShardedLocation) {
      dest = String(cfg.prd.prdShardedLocation);
    } else if (
      cfg?.architecture?.architectureFile === src &&
      cfg?.architecture?.architectureShardedLocation
    ) {
      dest = String(cfg.architecture.architectureShardedLocation);
    }
  }
  const displaySrc = basename(src);
  const displayDest = path.isAbsolute(dest)
    ? dest
    : (dest.startsWith(".") ? dest : `./${dest}`);
  return { src, dest, displaySrc, displayDest };
}

async function shardAndWrite(src: string, dest: string): Promise<void> {
  const displaySrc = basename(src);
  const displayDest = path.isAbsolute(dest)
    ? dest
    : (dest.startsWith(".") ? dest : `./${dest}`);

  const text = await Deno.readTextFile(src);
  const result = shardMarkdown(text);

  await ensureDir(dest);

  console.log(
    `\n📚 Exploding ${result.sections.length} sections from ${displaySrc} to ${displayDest}:\n`,
  );

  // Write section files first
  const usedFilenames = new Set<string>();
  const writePromises: Promise<void>[] = [];
  for (const section of result.sections) {
    const filenameBase = toKebab(section.title);
    const filename = uniqueName(`${filenameBase}.md`, usedFilenames);
    usedFilenames.add(filename);

    const adjusted = adjustHeadingLevels(
      section.contentLines.join("\n"),
      result.splitLevel,
    );
    const outPath = path.join(dest, filename);
    const writePromise = Deno.writeTextFile(
      outPath,
      adjusted + (adjusted.endsWith("\n") ? "" : "\n"),
    ).then(() => {
      console.log(`✅ Written to ${outPath}`);
    });
    writePromises.push(writePromise);
    console.log(`✅ Processing ${section.title} → ${filename}`);
  }

  await Promise.all(writePromises);

  // Then write index.md
  const indexContent = buildIndexContent(
    result.documentTitle,
    result.introLines.join("\n"),
    result.sections,
  );
  const indexPath = path.join(dest, "index.md");
  await Deno.writeTextFile(indexPath, indexContent);
  console.log(`✅ Written to ${indexPath}`);
  console.log(`✅ Processing Table of Contents → index.md`);

  console.log(
    `\n✨ Document exploded to ${displayDest} (${result.sections.length + 1} files)`,
  );
}

async function tryLoadCoreConfig(): Promise<CoreConfig | null> {
  try {
    const text = await Deno.readTextFile("bmad-core/core-config.yaml");
    const raw = parseYaml(text);
    if (!raw || typeof raw !== "object") return null;

    const out: CoreConfig = {};

    const prd = (raw as Record<string, unknown>)["prd"] as
      | Record<string, unknown>
      | undefined;
    if (prd && typeof prd === "object") {
      out.prd = {};
      if (typeof prd["prdFile"] === "string") {
        out.prd.prdFile = prd["prdFile"] as string;
      }
      if (typeof prd["prdShardedLocation"] === "string") {
        out.prd.prdShardedLocation = prd["prdShardedLocation"] as string;
      }
    }

    const architecture = (raw as Record<string, unknown>)["architecture"] as
      | Record<string, unknown>
      | undefined;
    if (architecture && typeof architecture === "object") {
      out.architecture = {};
      if (typeof architecture["architectureFile"] === "string") {
        out.architecture.architectureFile = architecture[
          "architectureFile"
        ] as string;
      }
      if (
        typeof architecture["architectureShardedLocation"] === "string"
      ) {
        out.architecture.architectureShardedLocation = architecture[
          "architectureShardedLocation"
        ] as string;
      }
    }

    return (out.prd || out.architecture) ? out : null;
  } catch {
    return null;
  }
}

// YAML parsing handled by std/yaml via deps; no custom parser needed.

function deriveDefaultDest(src: string): string {
  const { dir, name } = splitPath(src);
  // If the source is under docs/, mirror the folder under docs/
  const docsRoot = findDocsRoot(dir);
  if (docsRoot) {
    return path.join(docsRoot, name);
  }
  // Otherwise, create sibling folder
  return path.join(dir, name);
}

function shardMarkdown(input: string): {
  documentTitle: string;
  introLines: string[];
  sections: { title: string; contentLines: string[] }[];
  splitLevel: number;
} {
  const lines = normalizeNewlines(input).split("\n");

  // Track fenced code blocks (``` or ~~~)
  let inFence = false;
  let fenceMarker: string | null = null; // ``` or ~~~

  const introLines: string[] = [];
  const sections: { title: string; contentLines: string[] }[] = [];

  let currentSection: { title: string; contentLines: string[] } | null = null;
  const documentTitle = extractDocumentTitle(lines);

  // Auto-detect the heading level to split on (prefer the smallest level with >=2 occurrences)
  const splitLevel = detectSplitLevel(lines);
  const hRegex = new RegExp(`^${"#".repeat(splitLevel)}(\\s+|$)(.*)$`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Fence toggling: start/end when line begins with at least 3 backticks or tildes
    const fenceMatch = line.match(/^\s*([`~]{3,})(.*)$/);
    if (fenceMatch) {
      const marker = (fenceMatch[1] ?? "").includes("`") ? "```" : "~~~";
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (inFence && marker === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      // Push line as regular content to appropriate buffer
      if (currentSection) currentSection.contentLines.push(line);
      else introLines.push(line);
      continue;
    }

    // If inside fence, nothing is a heading
    if (inFence) {
      if (currentSection) currentSection.contentLines.push(line);
      else introLines.push(line);
      continue;
    }

    // Ignore H2 markers on indented code blocks (4+ spaces)
    if (/^\s{4,}\S/.test(line)) {
      if (currentSection) currentSection.contentLines.push(line);
      else introLines.push(line);
      continue;
    }

    // Detect split-level headings (ATX) based on auto-detected level
    const h2Match = line.match(hRegex);
    if (h2Match) {
      // Start a new section
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = h2Match[2]?.trim() ?? "";
      currentSection = { title: title || "section", contentLines: [line] };
      continue;
    }

    // Regular line append to current buffer
    if (currentSection) currentSection.contentLines.push(line);
    else introLines.push(line);
  }

  // Push last open section
  if (currentSection) sections.push(currentSection);

  return { documentTitle, introLines, sections, splitLevel };
}

function detectSplitLevel(lines: string[]): number {
  // Scan for headings outside code fences and count H2..H6 occurrences
  let inFence = false;
  let fenceMarker: string | null = null;
  const counts: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*([`~]{3,})(.*)$/);
    if (fenceMatch) {
      const marker = (fenceMatch[1] ?? "").includes("`") ? "```" : "~~~";
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,6})(\s+|$)/);
    if (m) {
      const level = (m[1] ?? "").length;
      counts[level] = (counts[level] ?? 0) + 1;
    }
  }
  // Prefer the smallest level with >= 2 occurrences
  for (let lvl = 2; lvl <= 6; lvl++) {
    if ((counts[lvl] ?? 0) >= 2) return lvl;
  }
  // Otherwise pick the smallest level with any occurrence
  for (let lvl = 2; lvl <= 6; lvl++) {
    if ((counts[lvl] ?? 0) >= 1) return lvl;
  }
  // Default to H2
  return 2;
}

function extractDocumentTitle(lines: string[]): string {
  // Prefer first ATX H1 (# Title) before first H2; fallback to first non-empty line
  let title = "";
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*([`~]{3,})(.*)$/);
    if (fenceMatch) break; // stop scanning on first fence to avoid scanning code blocks
    const h1 = line.match(/^#(\s+|$)(.*)$/);
    if (h1) {
      title = (h1[2] ?? "").trim();
      break;
    }
    if (!title && line.trim().length > 0 && !line.startsWith("<!--")) {
      title = line.trim();
    }
  }
  return title || "Document";
}

function adjustHeadingLevels(content: string, splitLevel: number): string {
  const lines = content.split("\n");
  let inFence = false;
  let fenceMarker: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    const fenceMatch = line.match(/^\s*([`~]{3,})(.*)$/);
    if (fenceMatch) {
      const marker = (fenceMatch[1] ?? "").includes("`") ? "```" : "~~~";
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (inFence && marker === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) continue;

    // Only decrease levels for headings at or deeper than the split level
    const hMatch = line.match(/^(#{1,6})(\s+.*|\s*$)/);
    if (hMatch) {
      const hashes = hMatch[1] ?? "";
      const rest = hMatch[2] ?? "";
      if (hashes.length >= splitLevel) {
        const delta = splitLevel - 1;
        const newHashes = "#".repeat(Math.max(1, hashes.length - delta));
        lines[i] = `${newHashes}${rest}`;
      }
    }
  }
  return lines.join("\n");
}

function buildIndexContent(
  title: string,
  intro: string,
  sections: { title: string }[],
): string {
  const lines: string[] = [];
  lines.push(`# ${title || "Document"}`);
  if (intro.trim().length > 0) {
    lines.push("\n" + intro.trim() + "\n");
  }
  lines.push("\n## Sections\n");
  for (const s of sections) {
    const file = `${toKebab(s.title)}.md`;
    lines.push(`- [${s.title}](./${file})`);
  }
  lines.push("\n");
  return lines.join("\n");
}

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s\-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function uniqueName(filename: string, used: Set<string>): string {
  if (!used.has(filename)) return filename;
  const extIdx = filename.lastIndexOf(".");
  const base = extIdx >= 0 ? filename.slice(0, extIdx) : filename;
  const ext = extIdx >= 0 ? filename.slice(extIdx) : "";
  let i = 2;
  while (used.has(`${base}-${i}${ext}`)) i++;
  return `${base}-${i}${ext}`;
}

function ensureDir(path: string): Promise<void> {
  return Deno.mkdir(path, { recursive: true });
}

function splitPath(p: string): { dir: string; name: string } {
  const dir = path.dirname(p);
  const base = path.basename(p);
  const name = base.slice(0, base.length - path.extname(base).length);
  return { dir, name };
}

// Using std/path from deps for path-safe operations across platforms

function findDocsRoot(dir: string): string | null {
  let cur = path.normalize(dir);
  while (true) {
    if (path.basename(cur) === "docs") return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n?/g, "\n");
}
