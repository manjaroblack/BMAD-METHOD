# **Development Workflow**

* **Prerequisites**: Deno runtime.  
* **Initial Setup**: deno cache deps.ts.  
* **Development Commands**: deno task dev, deno task test, deno task lint.  
* **Debugging**: A combination of file-based structured logging and a toggleable in-app debug panel for real-time state inspection.

## Documentation Tasks

Use docs-as-code tasks to keep examples executable and references current:

```bash
# Execute doctests in README and docs
deno task docs:test

# Lint and generate API docs (optional HTML/JSON artifacts)
deno task api:lint
deno task api:html
deno task api:json

  # Optional: build and serve the Lume docs site with Pagefind search
  deno task docs:build
  deno task docs:serve
```

Docs build tooling (Lume config, deps, docs-only Deno config) lives in `tools/docs/` and is referenced by the tasks above. The `docs/` directory is content-only; output is written to `docs/_site/`.

See also: `./documentation-strategy.md` and `../typescript-rules.md#documentation-patterns`.
