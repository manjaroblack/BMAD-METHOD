# **4\. Technical Assumptions and Integration Requirements**

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
