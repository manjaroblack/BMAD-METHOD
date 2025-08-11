# **High Level Architecture**

## **Technical Summary**

This project will establish a modern, modular, and service-oriented architecture for the BMad-Method TUI, built entirely on **Deno** and **TypeScript**. The architecture replaces the legacy Node.js scripts with a unified, app-like terminal interface using a **Signal-based** reactive pattern with the deno\_tui library. The "frontend" TUI layer will communicate with a "backend" service layer through clearly defined interfaces using dependency injection. This approach directly supports the PRD's goals of creating a polished, user-friendly, and maintainable application that streamlines both installation and developer workflows.

## **Platform and Infrastructure Choice**

The application is not cloud-hosted; it is designed for cross-platform local execution on the user's machine.

* **Platform:** User's local terminal environment. The TUI must be compatible with Windows Terminal, macOS Terminal.app, and GNOME Terminal.  
* **Key Services:**  
  * **Deno Runtime:** Provides the secure, TypeScript-native execution environment.  
  * **Local File System:** Required for detecting existing installations, managing .bmad-core files, and reading/writing configuration.  
  * **System Editor:** The TUI will need to launch the user's default editor to modify configuration files like core-config.yaml.  
* **Deployment Host and Regions:** Not applicable. The application is installed and run directly on the user's machine, and updates are delivered through new releases of the bmad-method package.

## **Repository Structure**

The project will be developed within a single, unified repository.

* **Structure:** Single Repository.  
* **Rationale:** This approach simplifies dependency management and ensures that the TUI and its underlying services are always developed and versioned together. The legacy Node.js project will be archived within a /legacy sub-directory.

## **High Level Architecture Diagram**

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

## **Architectural Patterns**

* **Signal-based Architecture**: A modern, declarative pattern where state is held in "signals." When a signal's value changes, it automatically and efficiently updates *only* the specific parts of the UI that depend on it. This is the most performant and cutting-edge choice for a responsive TUI.  
* **Dependency Injection (DI)**: Services will be provided to the UI components and other services using DI, decoupling the UI from business logic and making components highly testable.  
* **Service Layer Pattern**: All core business logic will be encapsulated within dedicated service modules, promoting reusability and adhering to the Single Responsibility Principle.  
* **Command Pattern**: Direct CLI commands and TUI menu actions will both be treated as commands that are executed by the appropriate service, unifying logic for interactive and non-interactive execution.
