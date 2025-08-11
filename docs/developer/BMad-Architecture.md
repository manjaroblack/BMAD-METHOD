# **BMad-Method TUI Fullstack Architecture Document**

## **Introduction**

This document outlines the complete fullstack architecture for the BMad-Method TUI, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack. This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### **Starter Template or Existing Project**

Based on my analysis of the PRD, this project is a significant enhancement to the existing BMad-Method framework. The core technical approach involves building a new Text-based User Interface (TUI) from scratch using **Deno** and **TypeScript**. The existing Node.js-based scripts and logic will be archived into a /legacy directory for reference, not used as a direct foundation for the new code.

Therefore, while this is a "brownfield" project in context, the TUI component itself will be a greenfield implementation. No external starter template is specified; the architecture will be defined based on the principles outlined in the PRD.

### **Change Log**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| 2025-08-10 | 1.3 | Added core agent location and clarified validator tool. | Winston (Architect) |
| 2025-08-10 | 1.2 | Integrated BMad Asset Source Kit structure. | Winston (Architect) |
| 2025-08-10 | 1.1 | Added missing UI views and clarified project structure. | Winston (Architect) |
| 2025-08-10 | 1.0 | Initial Draft of Architecture | Winston (Architect) |

## **High Level Architecture**

### **Technical Summary**

This project will establish a modern, modular, and service-oriented architecture for the BMad-Method TUI, built entirely on **Deno** and **TypeScript**. The architecture replaces the legacy Node.js scripts with a unified, app-like terminal interface using a **Signal-based** reactive pattern with the deno\_tui library. The "frontend" TUI layer will communicate with a "backend" service layer through clearly defined interfaces using dependency injection. This approach directly supports the PRD's goals of creating a polished, user-friendly, and maintainable application that streamlines both installation and developer workflows.

### **Platform and Infrastructure Choice**

The application is not cloud-hosted; it is designed for cross-platform local execution on the user's machine.

* **Platform:** User's local terminal environment. The TUI must be compatible with Windows Terminal, macOS Terminal.app, and GNOME Terminal.  
* **Key Services:**  
  * **Deno Runtime:** Provides the secure, TypeScript-native execution environment.  
  * **Local File System:** Required for detecting existing installations, managing .bmad-core files, and reading/writing configuration.  
  * **System Editor:** The TUI will need to launch the user's default editor to modify configuration files like core-config.yaml.  
* **Deployment Host and Regions:** Not applicable. The application is installed and run directly on the user's machine, and updates are delivered through new releases of the bmad-method package.

### **Repository Structure**

The project will be developed within a single, unified repository.

* **Structure:** Single Repository.  
* **Rationale:** This approach simplifies dependency management and ensures that the TUI and its underlying services are always developed and versioned together. The legacy Node.js project will be archived within a /legacy sub-directory.

### **High Level Architecture Diagram**

graph TD  
    subgraph User's Machine  
        subgraph Terminal  
            User \-- "deno task \<cmd\>" \--\> App\_Entry{App Entry Point}  
        end

        subgraph TUI Application (deno\_tui/Signals)  
            App\_Entry \--\> MainMenu\[Main Menu View\]  
            MainMenu \--\> InstallView\[Install View\]  
            MainMenu \--\> UpdateView\[Update View\]  
            MainMenu \--\> UninstallView\[Uninstall View\]  
            MainMenu \--\> ToolkitView\[Toolkit View\]  
        end

        subgraph Core Services (Deno/TypeScript)  
            InstallView \--\> InstallerService\[Installer Service\]  
            UpdateView \--\> UpdaterService\[Updater Service\]  
            UninstallView \--\> UninstallerService\[Uninstaller Service\]  
            ToolkitView \--\> ToolkitService\[Toolkit Service\]  
        end

        subgraph System Integrations  
            InstallerService \-- Manages \--\> FileSystem\[.bmad-core\]  
            UpdaterService \-- Reads \--\> InstallationManifest\[installation-manifest.json\]  
            UninstallerService \-- Modifies \--\> InstallationManifest  
            ToolkitService \-- Reads \--\> DenoJSON\[deno.json\]  
        end  
    end

### **Architectural Patterns**

* **Signal-based Architecture**: A modern, declarative pattern where state is held in "signals." When a signal's value changes, it automatically and efficiently updates *only* the specific parts of the UI that depend on it. This is the most performant and cutting-edge choice for a responsive TUI.  
* **Dependency Injection (DI)**: Services will be provided to the UI components and other services using DI, decoupling the UI from business logic and making components highly testable.  
* **Service Layer Pattern**: All core business logic will be encapsulated within dedicated service modules, promoting reusability and adhering to the Single Responsibility Principle.  
* **Command Pattern**: Direct CLI commands and TUI menu actions will both be treated as commands that are executed by the appropriate service, unifying logic for interactive and non-interactive execution.

## **Tech Stack**

This table provides the single source of truth for all technologies, frameworks, and libraries to be used.

| Category | Technology | Version | Purpose | Rationale |
| :---- | :---- | :---- | :---- | :---- |
| **Runtime** | Deno | Latest Stable | Provides the secure, TypeScript-native execution environment. | Aligns with the PRD's core technical direction for a modern, secure, and dependency-managed codebase. |
| **Language** | TypeScript | Bundled with Deno | The primary language for all application and service logic. | Enforces strict typing and enables the creation of a robust, maintainable system. |
| **TUI Framework** | deno\_tui | Latest Stable | For building the interactive Text-based User Interface (TUI) components. | A powerful, Deno-native library that provides granular control over the terminal buffer. |
| **State Management** | Preact Signals | Latest Stable | For managing reactive UI state with fine-grained updates. | A mature, performant, and framework-agnostic library that is the ideal choice for a Signal-based architecture. |
| **Dependency Mgmt** | JSR / deno.json | N/A | To manage and version all third-party and internal dependencies. | Follows Deno best practices for centralized and explicit dependency management. |
| **Storage** | Local File System | N/A | For installing/managing .bmad-core files and reading configuration. | The application's primary function is to manage local project files and state. |
| **Testing** | Deno Test Runner | Bundled with Deno | For all unit and integration tests across the entire codebase. | Leverages Deno's built-in, first-class testing capabilities. |
| **CI/CD** | GitHub Actions | N/A | To automate testing, validation, and release processes. | Industry standard, integrates well with source control, and provides Deno support. |
| **Logging** | Deno Standard Library Log | Latest Stable | To capture debug and error information without corrupting the TUI display. | Fulfills the PRD requirement for a non-disruptive debugging mechanism. |

## **Data Models**

This section defines the primary data structures that will be used throughout the application.

### **InstallationManifest**

**Purpose**: To act as the single source of truth for the entire BMad installation on the user's machine. It tracks the core version and all installed modules.

#### **JSON Schema**

{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "BMad Installation Manifest",  
  "description": "Defines the structure for tracking the core BMad installation and any installed modules.",  
  "type": "object",  
  "required": \["schemaVersion", "core", "modules"\],  
  "properties": {  
    "schemaVersion": { "type": "string" },  
    "core": {  
      "type": "object",  
      "required": \["version", "installedOn"\],  
      "properties": {  
        "version": { "type": "string" },  
        "installedOn": { "type": "string", "format": "date-time" }  
      }  
    },  
    "modules": {  
      "type": "array",  
      "items": {  
        "type": "object",  
        "required": \["id", "version", "installedOn", "slashPrefix", "assetMap"\],  
        "properties": {  
          "id": { "type": "string" },  
          "version": { "type": "string" },  
          "installedOn": { "type": "string", "format": "date-time" },  
          "slashPrefix": { "type": "string" },  
          "assetMap": { "type": "object" }  
        }  
      }  
    }  
  }  
}

## **API Specification**

A formal API specification is not applicable for this project.

## **Components**

### **UI Components**

* **TUI Application Shell**: Main entry point and container for the TUI. Manages layout and global key presses.  
* **Main Menu View**: Dynamically renders separate, top-level menu options for "Install," "Update," and "Uninstall" based on system state.  
* **Installer Wizard View**: Manages the multi-step guided installation process.  
* **Updater View**: Manages the user interface for selecting and applying updates.  
* **Uninstaller View**: Manages the user interface for selecting and removing modules or the core application.  
* **Toolkit Menu View**: Displays and executes available utility scripts from deno.json.

### **Core Services**

* **Installer Service**: Contains business logic for the initial installation of BMad and its modules.  
* **Updater Service**: Manages checking for and applying updates to the core application and installed modules.  
* **Uninstaller Service**: Manages the removal of the core BMad-Method and any installed modules.  
* **Toolkit Service**: Reads deno.json, parses tasks, and executes them as subprocesses.  
* **Config Service**: Handles interactions with configuration files like core-config.yaml.  
* **Validation Service**: Implements logic for validating internal tools and external modules. This service will also be exposed as a user-facing tool via a deno.json task (e.g., deno task validate-module) for developers creating new modules.

## **External APIs**

### **BMad Version Check API**

* **Purpose**: To provide the latest version information for the BMad core and all official modules.  
* **Base URL(s)**: https://bmad.dev/versions/ (Example)  
* **Authentication**: None.  
* **Key Endpoints Used**:  
  * GET /versions/manifest.json \- Retrieves a JSON file with the latest versions.  
* **Integration Notes**: The Updater Service will fetch this remote manifest to compare against the local installation-manifest.json. This is crucial for proactively notifying users of available updates, as Deno caches scripts by default and users may not know to run with the \--reload flag.

## **Core Workflows**

### **Workflow: First-Time Installation**

sequenceDiagram  
    participant User  
    participant MainMenu as Main Menu View  
    participant Installer as Installer Service

    User-\>\>MainMenu: Runs TUI Application  
    activate MainMenu  
    MainMenu--\>\>User: Displays options (Install, Toolkit, etc.)  
    User-\>\>MainMenu: Selects "Install BMad-Method"  
    MainMenu-\>\>Installer: installCore()  
    activate Installer

    Installer--\>\>MainMenu: Prompts for installation path  
    deactivate Installer  
    MainMenu--\>\>User: Asks user to confirm path  
    User-\>\>MainMenu: Confirms path  
    MainMenu-\>\>Installer: installCore(confirmedPath)  
    activate Installer

    Installer-\>\>Installer: Copies core files to .bmad-core/  
    Installer-\>\>Installer: Creates initial installation-manifest.json  
    Installer--\>\>MainMenu: Returns success status  
    deactivate Installer

    MainMenu--\>\>User: Displays "Installation Complete\!"  
    deactivate MainMenu

## **Database Schema**

The "database schema" is the defined structure of our primary data file: **installation-manifest.json**.

## **Frontend Architecture (TUI)**

* **Component Architecture**: The TUI is a tree of components. "Views" are top-level components representing a screen, and they are composed of smaller, reusable "Components."  
* **State Management**: A **Signal-based architecture** using **Preact Signals** for hyper-efficient, fine-grained reactivity. Signals manage state, while Components and Views structure the UI.  
* **Routing**: A simple currentView property on the global state object, managed by the main TuiApplication.ts component.  
* **Services Layer**: UI views communicate with Core Services via **Dependency Injection**.

## **Backend Architecture (Core Services)**

* **Service Architecture**: An **In-Process Modular System**. Logic is encapsulated in distinct, single-responsibility service classes.  
* **Database Architecture**: The installation-manifest.json file is the database. A **Manifest Repository** module will encapsulate all file system read/write logic.  
* **Authentication/Authorization**: Not applicable for this local tool.

## **Unified Project Structure**

### **TUI Application Structure**

This structure represents the repository for the **TUI application itself**. It contains the source code for the TUI and the BMad framework assets that it will install.

bmad-method-tui/  
├── .github/  
│   └── workflows/  
│       └── ci.yaml  
├── docs/  
│   ├── developer/        \# Guides for contributing to BMad  
│   ├── project/          \# Docs for this TUI project (PRD, Architecture)  
│   └── user/             \# Guides for end-users of the TUI  
├── legacy/                 \# Archived legacy Node.js codebase  
├── src/  
│   ├── assets/             \# Source assets for the core BMad framework (tasks, templates, etc.)  
│   ├── modules/            \# Source assets for third-party modules  
│   ├── agents/             \# Source definitions for the CORE BMad agents  
│   ├── services/           \# "Backend": Core logic services for the TUI  
│   ├── tui/                \# "Frontend": All TUI-related components and views  
│   ├── core/               \# Shared code, types, and manifest logic for the TUI  
│   └── main.ts             \# Main application entry point  
├── tests/  
├── .gitignore  
├── deno.json  
├── deps.ts  
└── README.md

### **BMad Framework Source Kit (Developer-Facing)**

For developers contributing to the BMad framework itself, the assets within src/assets, src/modules, and src/agents will follow a compositional model. Developers create agents and modules by writing simple **YAML definition files** that reference reusable **Markdown content files**. The installer acts as a "build tool" that processes this developer-friendly source into the final, optimized format for the AI agents in the user's project.

## **Development Workflow**

* **Prerequisites**: Deno runtime.  
* **Initial Setup**: deno cache deps.ts.  
* **Development Commands**: deno task dev, deno task test, deno task lint.  
* **Debugging**: A combination of file-based structured logging and a toggleable in-app debug panel for real-time state inspection.

## **Deployment Architecture**

* **Deployment Method**: Publish the TypeScript source code as a versioned package to the **JSR** registry.  
* **User Command**: deno run jsr:@bmad/tui  
* **CI/CD Pipeline**: A GitHub Actions workflow will test the code and publish it to JSR on new version tags.

## **Security and Performance**

* **Security**: Focuses on **Deno runtime permissions**, requesting only what is necessary (--allow-read, \--allow-write, \--allow-run, \--allow-net). Dependencies are pinned and audited.  
* **Performance**: Aims for instant UI feedback (\<50ms) through a Signal-based architecture. Backend operations are optimized for speed (\<100ms for file I/O).

## **Testing Strategy**

* **Pyramid**: A wide base of fast unit tests for services and components, a middle layer of integration tests, and a narrow top of E2E tests.  
* **Organization**: Tests reside in a top-level tests/ directory, mirroring the src/ structure.  
* **Tools**: Deno's built-in test runner is used for all tests. E2E tests run the TUI as a subprocess and assert on its text output.

## **Coding Standards**

* **Definitive Guide**: The typescript-rules.md document.  
* **Critical Rules**: Centralize dependencies in deps.ts, enforce strict type safety, use dependency injection, prefer immutability, and use Deno-native APIs.  
* **Naming Conventions**: Standardized naming for interfaces, classes, functions, and variables.

## **Error Handling Strategy**

* **Error Flow**: Services throw custom, typed BMadError objects. The TUI layer catches these errors, logs the full technical details to a file, and displays a user-friendly message in the UI.  
* **Custom Error Class**: A BMadError class provides a friendlyMessage for the UI, a code for programmatic handling, the original cause for logging, and an isFatal flag.

## **Monitoring and Observability**

* **Tools**: The primary monitoring tools are the **Structured Log File** for historical analysis and the **In-App Debug Panel** for real-time state and performance inspection.  
* **Key Metrics**: UI state, user actions, service call success/failure, and error stack traces.

## **Checklist Results Report**

The architecture has been validated against the architect-checklist and is deemed **High** readiness. It is modular, aligned with Deno best practices, and provides a solid foundation for development.

## **Next Steps**

The architecture is complete. The next step is to engage the **Scrum Master (SM) agent** to begin creating detailed stories from the PRD and this document for the developer agent to implement.