# **5\. TypeScript Ruleset & Architectural Principles**

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
