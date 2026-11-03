# ADR-0002 — Runtime: pure Rust backend, no Node sidecar

- **Status:** Proposed (technical decision pending PoC)
- **Date:** 2026-11-03
- **Decider:** OPENCODE-MAESTRO
- **Informs:** ADR-0001 (hypothesis → now partially validated)

## Context

Research (see `docs/research/runtime-and-cli-communication.md`) confirmed:

1. Tauri 2 + PTY is viable via `portable-pty` (Rust) — reference `shellboard`.
2. xterm.js ↔ tmux is standard (WebSocket + PTY; `tmux new-session -A`).
3. None of the four target CLIs exposes a local MCP server; structured I/O comes
   from each CLI's headless JSON mode (flags/SDK/HTTP), not from tmux key injection.

The remaining question was whether structured agent communication needs a Node
sidecar (for the TypeScript SDKs) or can stay in Rust.

## Decision

Keep the backend **pure Rust**, no Node sidecar:

- **Interactive terminal view:** `portable-pty` + `tmux` → xterm.js.
- **Structured communication (task/reply):** spawn each CLI in headless mode and
  drive it over stdio JSON/JSONL (HTTP for `opencode serve`), captured by the Rust
  broker.
- Broker IPC: Unix sockets (per ADR-0001).

## Rationale

- Matches the ADR-0001 stack ("Rust for backend and communication").
- Avoids a second runtime and inter-process marshalling — a sidecar is extra
  complexity not yet justified.
- Every CLI offers a stdio-JSON headless mode that Rust can spawn and parse.

## Risks / to validate with PoC

1. Claude `stream-json` requires `--verbose` + bidirectional `--input-format
   stream-json`; confirm protocol stability.
2. Codex: prefer `codex exec --json`/app-server over raw `--json` (issue #15451).
3. Gemini CLI may be replaced by "Antigravity CLI" — treat as unstable.
4. Validate real PTY → xterm.js rendering on Wayland (blank-window issues on some
   compositors; see research).
