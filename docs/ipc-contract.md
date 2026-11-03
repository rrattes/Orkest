# IPC contract (frontend ↔ backend) — v0.1

Stable boundary between the React frontend and the Rust backend. Both builders
code against this file; change it only via the Maestro.

## Tauri commands (frontend invokes)

| Command | Args | Returns | Notes |
|---|---|---|---|
| `create_session` | `agent_id: String` | `SessionInfo { id, title }` | spawn PTY running `tmux new-session -A -s orkest-<id>` |
| `write_input` | `session_id: String, data: String` | `()` | UTF-8 bytes → PTY stdin |
| `resize_pty` | `session_id: String, cols: u16, rows: u16` | `()` | on xterm `fit` resize |
| `close_session` | `session_id: String` | `()` | detach + kill tmux/PTY |

## Tauri events (backend emits → frontend listens)

| Event | Payload | Notes |
|---|---|---|
| `session-output` | `{ session_id: String, data: String }` | streamed PTY stdout |
| `session-exit` | `{ session_id: String, code: i32 }` | session ended |

## Conventions

- Session IDs are backend-generated UUIDs; the frontend treats them as opaque.
- One PTY/tmux session per agent tab; closing a tab must not silently kill a
  running task (frontend asks, backend only kills on explicit `close_session`).
- `portable-pty` + tmux for the interactive terminal only; structured agent
  communication is a later milestone (see ADR-0002).
