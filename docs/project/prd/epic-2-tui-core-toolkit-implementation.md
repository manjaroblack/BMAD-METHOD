# **Epic 2: TUI Core & Toolkit Implementation**  

* **Goal:** Build the foundational TUI application and implement the Project Toolkit feature, including both the interactive TUI and the direct CLI bypass.  
* **Key Features:** Set up core TUI application with dynamic header, implement main menu, refactor package.json script-running logic into a Deno service, build TUI view for toolkit, implement CLI bypass for toolkit (e.g., deno task toolkit flatten), implement command to open core-config.yaml.  

## Documentation & Testing

* All exported TUI modules are documented with JSDoc/TSDoc; examples are present and executable.
* CLI usage examples for the toolkit (interactive and bypass) are included in docs and verified via `deno task docs:test`.
* User guide pages for the Toolkit exist in `docs/` and are indexed by Pagefind in the Lume site build.
* API surfaces are reflected in versioned JSR-hosted API docs (links) or generated via `deno task api:html`/`api:json`.
* Cross-link to `../architecture/documentation-strategy.md` for reference.
