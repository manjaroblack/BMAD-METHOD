# **Unified Project Structure**

## **TUI Application Structure**

This structure represents the repository for the **TUI application itself**. It contains the source code for the TUI and the BMad framework assets that it will install.

bmad-method-tui/  
├── .github/  
│   └── workflows/  
│       └── ci.yaml  
├── tools/              # Build tooling (non-runtime)
│   └── docs/           # Documentation build tooling (Lume config, deps, docs-only Deno config)
│       ├── _config.ts
│       ├── deps.ts
│       └── deno.docs.jsonc
├── docs/  
│   ├── developer/        # Guides for contributing to BMad  
│   ├── project/          # Docs for this TUI project (PRD, Architecture)  
│   └── user/             # Guides for end-users of the TUI  
├── legacy/                 # Archived legacy Node.js codebase  
├── src/  
│   ├── assets/             # Source assets for the core BMad framework (tasks, templates, etc.)  
│   ├── modules/            # Source assets for third-party modules  
│   ├── agents/             # Source definitions for the CORE BMad agents  
│   ├── services/           # "Backend": Core logic services for the TUI  
│   ├── tui/                # "Frontend": All TUI-related components and views  
│   ├── core/               # Shared code, types, and manifest logic for the TUI  
│   └── main.ts             # Main application entry point  
│   ├── tui/                # "Frontend": All TUI-related components and views  
│   ├── core/               # Shared code, types, and manifest logic for the TUI  
│   └── main.ts             # Main application entry point  
├── tests/  
├── .gitignore  
├── deno.json  
├── deps.ts  
└── README.md

## **BMad Framework Source Kit (Developer-Facing)**

For developers contributing to the BMad framework itself, the assets within src/assets, src/modules, and src/agents will follow a compositional model. Developers create agents and modules by writing simple **YAML definition files** that reference reusable **Markdown content files**. The installer acts as a "build tool" that processes this developer-friendly source into the final, optimized format for the AI agents in the user's project.
