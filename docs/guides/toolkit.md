# Guide: Toolkit

This guide explains how to list and run Toolkit tasks from the CLI.

## Prerequisites

- Deno installed
- Project checked out locally

## List Tasks

Toolkit tasks are defined in your project configuration and exposed through the app.

```sh
# To see tasks using the app's service directly, run the TUI or use CLI mode.
# The TUI shows tasks under the Toolkit view.
```

## Run a Task (CLI bypass)

Run a configured task without starting the TUI:

```sh
# General form
deno run -A src/main.ts --toolkit <task> -- -- <args>

# Examples
deno run -A src/main.ts --toolkit test
# Pass-through args go after --
deno run -A src/main.ts --toolkit lint -- --quiet
```

- Everything after the first `--` is forwarded to the underlying command.
- The command is executed with the task name as a Deno task invocation or raw command per configuration.

## Open Config

```sh
deno run -A src/main.ts --open-config
```

Opens the configuration backing Toolkit tasks for review/editing.

## Troubleshooting

- Unknown task name:
  - Ensure it exists in the configuration (see Open Config).
- Need more logging:
  - Pass additional flags after `--` (e.g., `-- --verbose`).
- Permissions:
  - Running tasks may require network/fs permissions depending on the command.
