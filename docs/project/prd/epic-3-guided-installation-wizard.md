# **Epic 3: Guided Installation Wizard**  

* **Goal:** Implement the guided installation wizard for new setups, including both the interactive TUI and the direct CLI bypass.  
* **Key Features:** Re-implement core installation logic as modular Deno services, build the multi-step TUI wizard for a fresh installation, implement interactive browser for agents/modules, implement CLI bypass for installer (e.g., deno task install \--full).  

## Documentation & Testing

* Exported installer services are documented with JSDoc/TSDoc; examples are present and executable.
* CLI flags and examples (interactive and bypass) are included in docs and verified via `deno task docs:test`.
* Error and rollback scenarios are documented with examples; doctests verify snippets.
* User guide pages for Installation exist in `docs/` and are indexed by Pagefind in the Lume site build.
* Cross-link to `../architecture/documentation-strategy.md` for reference.
