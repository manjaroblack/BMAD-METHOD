# Guide: TUI

This guide covers running the BMAD TUI, common navigation, and keyboard shortcuts.

## Run the TUI

```sh
# From repository root
deno task tui
```

- The header shows app/version, current view, install status, and quick keys.
- Global keys: `?` opens Help. `q` quits.

## Keyboard Shortcuts

- `?` Help — open the in‑app Help view
- `q` Quit — exit the TUI
- Arrow keys / Tab — move focus
- Enter — activate selected button

## Navigation

- Main Menu — entry point to Install/Update/Uninstall/Toolkit (based on state)
- Toolkit — browse and run configured Toolkit tasks
- Help — quick reference (this guide + shortcuts)
- Back — returns to Main Menu from sub‑views

## Layout notes

- Views center their content and adapt to terminal width.
- If your terminal is narrow, content may reflow within sections.

## Troubleshooting

- Nothing happens on key presses:
  - Ensure the terminal is focused and not intercepting `?`/`q` (some shells bind these).
- Display looks misaligned:
  - Increase terminal width/height; the UI computes centered rectangles based on size.
- Exiting the TUI:
  - Press `q` or close the terminal/tab.

## API Reference

- HTML API docs: `../api/`
- API JSON (machine-readable): `../api.json`

## See also

- Toolkit Guide: `./toolkit.md`
- Epic 2 – TUI Core & Toolkit Implementation: `../project/prd/epic-2-tui-core-toolkit-implementation.md`
