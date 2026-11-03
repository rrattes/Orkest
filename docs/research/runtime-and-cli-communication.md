# Research — Runtime and CLI communication (ORKEST-001)

Source: OPENCODE-RESEARCHER (Sage). Date: 2026-11-03.
Primary sources are cited inline; verify before hard-to-reverse decisions.

## 1. Tauri 2 + PTY — viable

- Backend PTY standard is the Rust crate `portable-pty` (^0.9).
- Reference implementation: `tauri-plugin-pty` v0.2.1 and the `shellboard` app
  (Tauri 2 + React 19 + xterm.js + portable-pty).
- Real requirement: WebKitGTK 4.1 (`libwebkit2gtk-4.1-dev`) + GTK3.
- Wayland limitations are window/rendering only (blank window on Sway #15050,
  DMABUF errors, `set_position` failure on GNOME Wayland #14913). **The PTY is
  independent of the display server.**
- Sources: v2.tauri.app/start/prerequisites; github.com/ok2cqr/shellboard;
  github.com/tauri-apps/tauri/issues/15050 and /14913.

## 2. xterm.js ↔ tmux — standard pattern

- Backend opens a PTY and runs `tmux new-session -A -s <name>` (idempotent attach);
  PTY bytes flow over WebSocket to xterm.js (`@xterm/addon-attach` + `@xterm/addon-fit`).
- Canonical reference: `webtmux` (Go + gorilla/websocket + xterm.js + webtty +
  tmux controller with pane/window messages).
- Structured alternative: tmux control mode (`tmux -CC`) for layout/panes without
  screen scraping.
- Source: github.com/chrismccord/webtmux.

## 3. CLI → structured I/O / MCP

| CLI | Structured I/O | MCP |
|---|---|---|
| Claude Code | `--output-format json\|stream-json` (JSONL) + `--json-schema`; hooks; Agent SDK (TS/Py) | client only; no standalone server (only in-process `sdk` type) |
| Codex | `@openai/codex-sdk` (JSONL over stdin/stdout); `codex app-server` (JSON-RPC: stdio/ws/unix); `codex exec --json --output-schema` | `codex mcp-server` removed/deprecated |
| OpenCode | `opencode serve` = headless HTTP server (OpenAPI 3.1 + SSE `/event`); `@opencode-ai/sdk` structured output | client only |
| Gemini CLI | `--output-format json\|stream-json` (JSONL) | client only |

- **None of the four exposes a native local MCP server** for Orkest to connect to;
  all act as MCP clients. Structured I/O must come from each CLI's flags/SDK/HTTP
  server, not MCP.

## 4. Concrete risks

- Codex `--json` + `--output-schema` breaks silently with tools/MCP active (issue
  #15451; fixed ~0.149.x) → prefer SDK/app-server.
- Claude `stream-json` needs `--verbose` and bidirectional control via
  `--input-format stream-json` (SDK protocol).
- Gemini CLI was replaced by "Antigravity CLI" (2026-06-18) — product/version risk.
- `tmux send-keys` / PTY key injection is **not reliable structured I/O**; reserve
  tmux/PTY for human interactive display.

## 5. Implication for ADR-0001

Backend Rust (`portable-pty`) vs Node sidecar decides the runtime shape. Keep the
backend pure Rust (no Node sidecar): drive each CLI's headless JSON mode from a
Rust subprocess (stdio JSONL, or HTTP for `opencode serve`), and use
`portable-pty` + tmux only for the interactive terminal view. See ADR-0002.
