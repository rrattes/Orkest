# ADR-0001 — Architecture hypothesis (unverified)

- **Status:** Proposed (hypothesis — to be validated before hard-to-reverse decisions)
- **Date:** 2026-11-03
- **Decider:** OPENCODE-MAESTRO

## Context

Orkest is a new, independent desktop application to manage CLI AI agents in real
terminal sessions. V1 targets Linux (Arch / Hyprland / Wayland). The GitHub
repository is empty; there is no existing code to preserve.

## Decision (hypothesis)

Adopt the following stack, subject to verification:

| Concern | Choice |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React + TypeScript |
| Terminal UI | xterm.js |
| Styling | Tailwind CSS + accessible components |
| Backend / IPC | Rust |
| Sessions | tmux / PTY |
| Persistence | SQLite |
| Task isolation | Git worktrees ("Floors") |
| Local communication | Unix sockets |

The execution engine (runtime, broker, sessions) must remain independent of the
Tauri UI layer.

## Consequences / risks to validate

1. Real interactive terminal (xterm.js ↔ tmux/PTY) under Wayland — needs a
   proof of concept before committing.
2. Whether `tmux send-keys` is sufficient for *reliable* agent communication, or
   whether each CLI exposes a structured/MCP interface we must use instead.
3. Tauri 2's PTY capabilities and Linux system dependencies on this host.

## Notes

- No Windows/macOS in V1, but avoid unnecessary coupling that would block them later.
- The Segundo Cérebro V4 is an optional integration, not a required dependency.
