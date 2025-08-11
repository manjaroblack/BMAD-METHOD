# **BMad-Method TUI Product Requirements Document (PRD)**

## **1\. Intro Project Analysis and Context**

This first section establishes our shared understanding of the existing project and the scope of the enhancement.

* **Existing Project Overview**  
  * **Analysis Source**: IDE-based fresh analysis of the provided codebase (flattened-codebase.xml).  
  * **Current Project State**: The BMad-Method is a Node.js-based framework that provides a suite of tools and AI agent definitions for agile development. Its primary user interaction for installation and tooling is currently handled through command-line scripts (tools/installer/installer.js, package.json scripts), which are functional but lack a guided user interface.  
* **Available Documentation Analysis**  
  * **Available Documentation**:  
    * \[x\] Tech Stack Documentation (Inferred from package.json)  
    * \[x\] Source Tree/Architecture (Inferred from file structure)  
    * \[ \] Coding Standards  
    * \[ \] API Documentation (N/A)  
    * \[ \] External API Documentation (N/A)  
    * \[ \] UX/UI Guidelines (N/A)  
    * \[ \] Technical Debt Documentation  
* **Enhancement Scope Definition**  
  * **Enhancement Type**:  
    * \[x\] New Feature Addition  
    * \[x\] UI/UX Overhaul (of the command-line experience)  
  * **Enhancement Description**: The project will create a unified Text-based User Interface (TUI) to act as a polished and intuitive front door for the BMad-Method, serving as both a guided installer for new users and an efficient toolkit for experienced contributors.  
  * **Impact Assessment**:  
    * \[x\] Significant Impact (substantial existing code changes, as the TUI will replace the core installer logic)  
* **Goals and Background Context**  
  * **Goals**:  
    * Increase user adoption by providing a more polished and user-friendly onboarding experience.  
    * Attract more contributors by making the project easier to install and manage.  
    * Improve workflow efficiency for experienced developers by providing a centralized command center.  
  * **Background Context**: The current command-line process for installing and managing the BMad-Method is functional but presents a barrier to entry for new users and is less efficient for experienced contributors. This TUI will replace the cumbersome script-based interaction with a professional, guided experience to increase adoption and streamline project management.  
* Change Log  

  | Change | Date | Version | Description | Author |  
  | :--- | :--- | :--- | :--- | :--- |  
  | Initial Draft | 2025-08-09 | 1.0 | First draft of the Brownfield PRD for the TUI project. | John (PM) |  
  | UI & Tech Update | 2025-08-09 | 1.1 | Added UI Design Goals and Technical Assumptions sections based on user feedback. | John (PM) |  
  | Major Pivot | 2025-08-09 | 2.0 | Reworked technical direction to Deno/TypeScript and updated Epic structure. | John (PM) |  
  | Final Tech Stack | 2025-08-09 | 2.1 | Changed TUI framework to Bubbles and added a formal debugging strategy. | John (PM) |  
  | TS Ruleset Update | 2025-08-09 | 2.2 | Expanded and refined the TypeScript ruleset and architectural principles. | John (PM) |  
  | Architect Sync | 2025-08-10 | 2.3 | Aligned PRD with final architecture: updated epics, tech stack, and standardized terminology. | John (PM) |

## **2\. Requirements**

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
  5. **NFR5:** The TUI must have file system access to detect existing BMad-Method installations and manage the .bmad-core files.  
  6. **NFR6:** The TUI application itself must be updatable via new releases of the bmad-method package.  
  7. **NFR7:** The application must include a robust debugging mechanism, such as logging to a file or a dedicated debug view, to facilitate development without disrupting the TUI.

## **3\. User Interface Design Goals**

This section outlines the high-level vision for the TUI's design and interaction to guide the development.

* **Overall UX Vision**: The TUI should function like a modern, app-like command-line tool. It will feature a persistent header area for branding and context, with a dynamic main content area that changes as the user navigates through menus and wizards. The experience should be fast, responsive, and intuitive.  
* **Key Interaction Paradigms**:  
  * Navigation will be primarily driven by arrow keys (Up/Down).  
  * Selections will be made with the Enter key.  
  * Multi-select options (e.g., custom installer) will use the Spacebar to toggle items.  
  * Esc and q will be consistently supported to go back a step or exit a menu.  
  * All menus will include an explicit "Back" or "Exit/Quit/Cancel" option.  
* **Core Screens and Views**:  
  * Main Menu Screen  
  * Installation Wizard (multi-step view)  
  * Project Toolkit Menu  
* **Accessibility**: The primary accessibility goal is full keyboard navigability. Screen reader compatibility is not an MVP requirement.  
* **Branding**: The TUI will feature a persistent header that displays banners from bannerArt.js. The main "BMAD-METHOD" banner will always be visible. Context-specific banners (e.g., "INSTALLER," "FLATTENER") will be displayed below the main banner depending on the user's current menu path.  
* **Target Device and Platforms**: The TUI must use a fluid layout that dynamically adjusts to the terminal's width and height, preventing improper line wrapping and ensuring all elements remain visible and aligned.

## **4\. Technical Assumptions and Integration Requirements**

This section defines the core technical decisions and constraints for the TUI project.

* **Technology Stack**  
  * **Runtime**: Deno  
  * **Language**: TypeScript  
  * **TUI/CLI Framework**: deno\_tui  
  * **State Management**: Signal-based architecture (Preact Signals)  
  * **Dependency Management**: Centralized deps.ts file and JSR.  
* **Integration Approach**  
  * **Code Integration Strategy**: The existing Node.js codebase will be archived into a /legacy directory for reference. The new TUI and all associated logic will be built from scratch following the specified Deno/TypeScript architecture. Legacy logic from tools/installer/installer.js will be re-implemented as modular services in the new architecture.  
  * **Testing Integration Strategy**: Unit and integration tests will be written using Deno's built-in test runner.  
* **Code Organization and Standards**  
  * **File Structure Approach**: The new codebase will follow the modular architecture defined in the "TypeScript Ruleset & Architectural Principles" section, with a clear separation of concerns into components, services, and interfaces.  
  * **Coding Standards**: All new code must adhere strictly to the rules defined in the "TypeScript Ruleset & Architectural Principles" section.  
* **Debugging Strategy**  
  * To overcome the challenges of debugging a full-screen terminal application, the TUI will implement a non-disruptive debugging strategy. This will involve either writing detailed logs to a dedicated file (e.g., .bmad-tui.log) or incorporating a toggleable debug panel within the TUI itself that can display state and log messages without corrupting the main UI.

## **5\. TypeScript Ruleset & Architectural Principles**

All development for this project must adhere to the following standards, which emphasize strict typing, performance, and a modular, Deno-native architecture.

* **Philosophy**:  
  * Strict typing with specific error types  
  * Performance-first with efficient patterns  
  * Functional patterns preferred  
  * Self-documenting code through explicit types  
  * Deno-native approaches over external dependencies  
  * Modular architecture with clear separation of concerns  
  * Dependency injection using interfaces for loose coupling  
  * Testing with Deno's built-in testing capabilities  
* **Core Rules**:  
  1. **Strict TypeScript Configuration**  
  2. **Centralized Internal and External Dependencies** in a deps.ts file  
  3. **Explicit .ts Extensions for Internal Imports**  
  4. Prefer const over let  
  5. **Explicit Function Return Types**  
  6. Group imports by type  
  7. No accumulating spread in loops  
  8. Prefer array shorthand syntax (string\[\] over Array\<string\>)  
  9. No dangerous operations (e.g., delete)  
* **Architectural Principles**:  
  * **Single Responsibility Principle**: Each module, class, and function has one purpose.  
  * **Reusability**: Design components to be reusable via interfaces.  
  * **Testability**: Enable easy unit testing through loose coupling.  
  * **Dependency Injection**: Decouple services completely using interfaces.  
  * **Modular Architecture Patterns**: Follow a clear, layered directory structure.  
  * **Deno-Native Patterns**: Leverage Deno's built-in capabilities for errors, logging, and testing.

## **6\. Epic and Story Structure**

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
