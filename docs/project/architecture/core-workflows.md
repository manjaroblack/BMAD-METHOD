# **Core Workflows**

## **Workflow: First-Time Installation**

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

    Installer-\>\>Installer: Copies core files to bmad-core/  
    Installer-\>\>Installer: Creates initial installation-manifest.json  
    Installer--\>\>MainMenu: Returns success status  
    deactivate Installer

    MainMenu--\>\>User: Displays "Installation Complete\!"  
    deactivate MainMenu
