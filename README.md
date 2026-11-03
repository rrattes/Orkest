# Orkest — Agent Terminal

Orkest is a Linux desktop application for managing CLI AI agents (Claude Code,
Codex, OpenCode, Gemini CLI) in real terminal sessions, with a refined interface
and reliable local communication.

> **Status:** early development (V1). Linux-only; Arch Linux + Hyprland/Wayland first.

## What it is

- **One tab = one agent**, identified by name, icon, CLI, model and state.
- **Real interactive terminals** — xterm.js on the frontend, tmux/PTY sessions on the backend.
- **A local message broker** with persistent messages and task↔reply correlation
  (Maestro ↔ specialists by default, with optional authorized peer connections).
- **Floors** — isolated task workspaces backed by Git worktrees.
- **Persistent, exportable** agent / Role / Connection / workspace-template config.
  Credentials, tokens and authenticated sessions are never exported.

## Stack (architecture hypothesis — see `docs/decisions/`)

- Tauri 2 (Rust backend)
- React + TypeScript + Tailwind CSS
- xterm.js
- tmux / PTY for sessions
- SQLite for persistence
- Unix sockets for local IPC

## Development

Prerequisites: Node.js 20+, Rust (stable), and the Tauri Linux system
dependencies (`webkit2gtk-4.1`, `gtk3`, `libsoup-3.0`, `javascriptcoregtk-4.1`).

```sh
npm install
npm run tauri dev
```

## Documentation

- `docs/architecture.md` — runtime, broker, floors and persistence.
- `docs/decisions/` — Architecture Decision Records.
- `docs/design/` — visual direction and design system (produced by the design lead).

## Known limitations

None validated yet — the current increment is focused on proving the runtime
(Tauri + xterm.js + real interactive terminal) before layering the broker and floors.
