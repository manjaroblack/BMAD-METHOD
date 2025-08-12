# **Coding Standards**

* **Definitive Guide**: The [typescript-rules.md](../typescript-rules.md) document.  
* **Critical Rules**: Centralize dependencies in deps.ts, enforce strict type safety, use dependency injection, prefer immutability, and use Deno-native APIs.  
* **Naming Conventions**: Standardized naming for interfaces, classes, functions, and variables.

## Documentation

* All exported symbols MUST have JSDoc/TSDoc with a concise summary, `@example` fenced `ts` blocks, explicit `@throws`, and lifecycle tags (`@deprecated`, `@experimental`, `@since`) where applicable.
* Examples SHOULD use pinned JSR imports (e.g., `jsr:@scope/pkg@1`) and be valid doctests.
* Prefer linking to versioned API docs (JSR) from narrative guides; avoid duplicating API details in guides.
* See:
  * `../typescript-rules.md#documentation-patterns`
  * `./documentation-strategy.md`
