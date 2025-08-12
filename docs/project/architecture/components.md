# **Components**

## **UI Components**

* **TUI Application Shell**: Main entry point and container for the TUI. Manages layout and global key presses.  
* **Main Menu View**: Dynamically renders separate, top-level menu options for "Install," "Update," and "Uninstall" based on system state.  
* **Installer Wizard View**: Manages the multi-step guided installation process.  
* **Updater View**: Manages the user interface for selecting and applying updates.  
* **Uninstaller View**: Manages the user interface for selecting and removing modules or the core application.  
* **Toolkit Menu View**: Displays and executes available utility scripts from deno.json.

## **Core Services**

* **Installer Service**: Contains business logic for the initial installation of BMad and its modules.  
* **Updater Service**: Manages checking for and applying updates to the core application and installed modules.  
* **Uninstaller Service**: Manages the removal of the core BMad-Method and any installed modules.  
* **Toolkit Service**: Reads deno.json, parses tasks, and executes them as subprocesses.  
* **Config Service**: Handles interactions with configuration files like core-config.yaml.  
* **Validation Service**: Implements logic for validating internal tools and external modules. This service will also be exposed as a user-facing tool via a deno.json task (e.g., deno task validate-module) for developers creating new modules.
