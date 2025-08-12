# **Testing Strategy**

* **Pyramid**: A wide base of fast unit tests for services and components, a middle layer of integration tests, and a narrow top of E2E tests.  
* **Organization**: Tests reside in a top-level tests/ directory, mirroring the src/ structure.  
* **Tools**: Deno's built-in test runner is used for all tests. E2E tests run the TUI as a subprocess and assert on its text output.

## Documentation Tests

Executable examples in Markdown (doctests) are part of the test pyramid to prevent docs drift. Run them locally and in CI:

```bash
deno test --doc README.md docs/**/*.md
```

See also: `./documentation-strategy.md`.
