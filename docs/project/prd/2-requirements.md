# **2\. Requirements**

These are the functional and non-functional requirements that will define the MVP of the BMad-Method TUI.

* **Functional Requirements**  
  1. **FR1:** The TUI must launch with a unified main menu offering options for "Installation", "Update", "Uninstallation", and "Project Toolkit".  
  2. **FR2:** The "Installation" option must launch a guided, multi-step wizard for new installations.  
  3. **FR3:** The installation wizard must handle path detection, installation type selection (Complete vs. Customize), and initial configuration.  
  4. **FR4:** The "Project Toolkit" option must lead to a menu that lists and executes project-level utility scripts defined in the project's deno.json.  
  5. **FR5:** The installation wizard must allow for interactive browsing of available agents and modules (navigating a list with arrow keys, selecting with spacebar/enter) to aid in customized installations.  
  6. **FR6:** The TUI must provide a command to open the core-config.yaml file in the user's default system editor.  
  7. **FR7:** The TUI must support command-line arguments that allow experienced users to bypass the interactive menu and execute commands directly (e.g., deno task install \--full, deno task toolkit flatten).  
  8. **FR8:** A validation script must be created to ensure all internal tools (like the flattener or installer) are correctly implemented with all required components (banner art, CLI options, etc.).  
  9. **FR9:** A validation script must be created for modules to ensure they meet the framework's structural and metadata requirements.  
  10. **FR10:** The "Update" option must provide a mechanism to check for and apply new versions of the BMad-Method.  
  11. **FR11:** The "Uninstallation" option must provide a guided process for removing the core application and/or installed modules.  
* **Non-Functional Requirements**  
  1. **NFR1:** The TUI must be a cross-platform Deno application, written in TypeScript.  
  2. **NFR2:** The TUI must render and function correctly in standard terminal environments, tested against the latest versions of Windows Terminal (Windows), Terminal.app (macOS), and GNOME Terminal (Ubuntu LTS).  
  3. **NFR3:** The interface must be purely text-based and fully navigable using only a keyboard.  
  4. **NFR4:** The TUI must be able to read from the project's deno.json file to discover and execute available tasks.  
  5. **NFR5:** The TUI must have file system access to detect existing BMad-Method installations and manage the bmad-core files.  
  6. **NFR6:** The TUI application itself must be updatable via new releases of the bmad-method package.  
  7. **NFR7:** The application must include a robust debugging mechanism, such as logging to a file or a dedicated debug view, to facilitate development without disrupting the TUI.  
  8. **NFR8:** Documentation must follow a docs-as-code approach: Markdown examples are executable doctests and must pass in CI (e.g., `deno test --doc README.md docs/**/*.md`).  
  9. **NFR9:** API surfaces must be documented with JSDoc/TSDoc and linted with `deno doc --lint`, and public API links must reference versioned pages hosted on JSR.  
  10. **NFR10:** Narrative documentation may be published as a static site built with Lume (MDX, Prism), separate from API docs.  
  11. **NFR11:** The documentation site must provide static, privacy-friendly search using Pagefind.  
  12. **NFR12:** Standard tasks must exist for docs and API: `docs:test`, `api:lint`, `api:html`, `api:json`, and optional `docs:build`, `docs:serve`.
