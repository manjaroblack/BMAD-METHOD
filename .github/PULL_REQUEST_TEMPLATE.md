# Pull Request Template

Thank you for your contribution! Please complete the sections below to help us review efficiently.

## Summary

- What does this change do? Why now?
- Scope and non-goals (if any)

## Screenshots / Demos (if applicable)

- [ ] Added before/after screenshots or a short demo/gif where useful

## Related Issues / Docs

- Closes #
- Context7 doc links (if API/behavior related):

## Reviewer Runbook

- Minimal steps to verify locally:

  ```sh
  deno fmt --check
  deno lint
  deno test -A
  # if perf-sensitive
  deno bench -A
  ```

## Checklist

General

- [ ] PR description explains the what/why clearly
- [ ] User-facing or breaking changes documented (migration notes if needed)
- [ ] Docs updated (README, docs/*) when behavior/config changes

TS/Deno compliance

- [ ] Imports follow JSR-first strategy; versions pinned (e.g., `jsr:@scope/pkg@x.y.z`)
- [ ] deno fmt run (and passes)
- [ ] deno lint passes
- [ ] Tests added/updated and pass locally: `deno test -A`
- [ ] Benchmarks added/updated for perf-sensitive code: `deno bench -A`
- [ ] Reproducibility: `deno.lock` updated and committed (or vendoring used per policy)
- [ ] Large files split: each file < 400 LOC (documentation excluded)
- [ ] Logging and configuration patterns follow our rules
- [ ] Node compatibility only where required; Web APIs preferred

Security / Quality

- [ ] Considered security impact of changes
- [ ] Optional: Semgrep scan run for touched areas (attach summary if findings)

CI & DX

- [ ] CI is green
- [ ] Added runbook/notes for reviewers to reproduce or validate

## References

- TS/Deno rules: `docs/typescript-rules.md`
- Global tooling rules: `/.codeium/windsurf-next/memories/global_rules.md`
