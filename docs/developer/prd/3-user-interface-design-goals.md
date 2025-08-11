# **3\. User Interface Design Goals**

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
