# **Epic 1: Project Modernization & Foundation**

* **Goal:** Modernize the BMad-Method codebase by migrating to a Deno and TypeScript foundation, establishing new coding standards, and archiving the legacy Node.js project.  
* **Key Features:** Archive legacy project, set up Deno project with deno.json and deps.ts, establish new modular directory structure, implement a basic CLI entry point.  

## Acceptance Criteria

1. deno.jsonc enforces strict TypeScript settings per rules (strict, noImplicitAny, explicit returns), and the checkJs policy is decided and documented.
2. deps.ts exists and centralizes both external (JSR-first) and internal imports; no direct deep imports in app code.
3. deno task commands exist and run: fmt, fmt:check, lint, lint:fix, test, bench, coverage, cache, upgrade, lock:freeze.
4. fmt and lint include/exclude patterns match our repo layout and do not scan dist/vendor/node_modules/.git.
5. Node compatibility stance set (no node_modules); import strategy is Web APIs/JSR-first.
6. Tests discover correctly (globs) and pass on a clean run; coverage task produces coverage.lcov.
7. Lockfile path defined and can be frozen in CI (deno lock --frozen).
8. Unstable features list is justified or trimmed; any enabled flags are documented in Dev Notes.
9. Workspace (if used) globs are valid or removed if not needed.
10. CI note: configuration is ready for GitHub Actions (or documented as a follow-up if not in scope).
11. Docs-as-code tasks exist and pass: `deno task docs:test` and `deno task api:lint`; optional `api:html`/`api:json` artifacts are generated successfully.
12. Lume scaffold present with Pagefind search; `deno task docs:build` succeeds locally and in CI (Linux step) and produces `docs/_site`.
13. CI runs doctests and `deno doc --lint`; artifacts uploaded for `docs/_site`, `docs/api`, and `docs/api.json`.
14. PRD and architecture are cross-linked to the Documentation Strategy (`../architecture/documentation-strategy.md`).
