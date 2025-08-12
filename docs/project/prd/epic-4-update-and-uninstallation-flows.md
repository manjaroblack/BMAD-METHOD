# **Epic 4: Update and Uninstallation Flows**  

* **Goal:** Implement the guided wizards for updating an existing installation and for uninstalling BMad-Method components.  
* **Key Features:** Develop services to check for new versions, build the TUI flow for updating, create services for safely removing core files and modules, build the TUI flow for uninstallation, implement CLI bypasses for both update and uninstall commands.  

## Documentation & Testing

* Update and uninstall procedures are documented with warnings and safeguards; CLI examples are doctested via `deno task docs:test`.
* Rollback/cleanup flows are documented with examples; doctests verify snippets.
* User guide pages for Update and Uninstall exist in `docs/` and are indexed by Pagefind in the Lume site build.
* Cross-link to `../architecture/documentation-strategy.md` for reference.
