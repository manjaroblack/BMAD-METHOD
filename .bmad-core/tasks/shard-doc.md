# Document Sharding Task

## Purpose

- Split a large document into multiple smaller documents by top-level sections (auto-detected, commonly H2)
- Create a folder structure to organize the sharded documents
- Maintain all content integrity including code blocks, diagrams, and markdown formatting

## Primary Method: Deno sharder (shard_markdown.ts)

Use the built-in Deno script to shard markdown by top-level sections while preserving code fences and formatting.

### Installation and Usage

- Command:

  ```bash
  deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts <source.md> [dest_dir]
  ```

- Config-driven invocation (no args):

  If `.bmad-core/core-config.yaml` contains:

  ```yaml
  prd:
    prdFile: docs/prd.md
    prdShardedLocation: docs/prd
  ```

  Then you can simply run:

  ```bash
  deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts
  ```

### Behavior

- Creates a destination folder (defaults to `docs/<basename>` if source is under `docs/`, otherwise a sibling folder)
- Writes `index.md` containing the original H1 and any intro content (before first split heading)
- Splits on an auto-detected heading level (prefers the smallest level with ≥2 occurrences; usually H2)
- Decreases heading levels within each section appropriately
- Preserves fenced code blocks and ignores headings inside them
- Does not treat indented code (4+ spaces) as headings

### Example

```bash
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts docs/prd.md docs/prd
```

### Output

- Section files like `tech-stack.md`, etc., plus `index.md`
- Console summary with written paths and a final count

### Quick usage modes

1. Shard both PRD and Architecture (from core-config)

```bash
# If both prd and architecture are defined in .bmad-core/core-config.yaml
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts --all

# Or simply no args if both are present in config
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts
```

1. Shard just one (from core-config)

```bash
# PRD only
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts --prd

# Architecture only
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts --arch
```

1. Manual source/dest (any file)

```bash
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts <source.md> [dest_dir]
```

### Help

```bash
deno run --allow-read --allow-write .bmad-core/utils/shard_markdown.ts --help
```

- Shows full usage, flags, and examples
