# **6\. Epic and Story Structure**

The project will be delivered through the following epics, which incorporate the technical migration and build the new TUI features incrementally.

* **Epic 1: Project Modernization & Foundation**  
  * **Goal:** Modernize the BMad-Method codebase by migrating to a Deno and TypeScript foundation, establishing new coding standards, and archiving the legacy Node.js project.  
  * **Key Features:** Archive legacy project, set up Deno project with deno.json and deps.ts, establish new modular directory structure, implement a basic CLI entry point.  
* **Epic 2: TUI Core & Toolkit Implementation**  
  * **Goal:** Build the foundational TUI application and implement the Project Toolkit feature, including both the interactive TUI and the direct CLI bypass.  
  * **Key Features:** Set up core TUI application with dynamic header, implement main menu, refactor package.json script-running logic into a Deno service, build TUI view for toolkit, implement CLI bypass for toolkit (e.g., deno task toolkit flatten), implement command to open core-config.yaml.  
* **Epic 3: Guided Installation Wizard**  
  * **Goal:** Implement the guided installation wizard for new setups, including both the interactive TUI and the direct CLI bypass.  
  * **Key Features:** Re-implement core installation logic as modular Deno services, build the multi-step TUI wizard for a fresh installation, implement interactive browser for agents/modules, implement CLI bypass for installer (e.g., deno task install \--full).  
* **Epic 4: Update and Uninstallation Flows**  
  * **Goal:** Implement the guided wizards for updating an existing installation and for uninstalling BMad-Method components.  
  * **Key Features:** Develop services to check for new versions, build the TUI flow for updating, create services for safely removing core files and modules, build the TUI flow for uninstallation, implement CLI bypasses for both update and uninstall commands.  
* **Epic 5: Validation Framework & Tooling**  
  * **Goal:** Create the validation scripts for internal tools and external modules to ensure they adhere to the new framework standards.  
  * **Key Features:** Develop a validation service to check for required components in a tool (banner art, CLI options, etc.), integrate validator into deno.json test scripts, develop a similar validator for modules.
