# **Tech Stack**

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
