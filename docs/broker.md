# Broker (milestone 2) — message model

Backend-only, Tauri-independent module `src-tauri/src/broker.rs`; SQLite via `rusqlite`
(DB: `<app_data_dir>/broker.db`).

## Message

| Field | Notes |
|---|---|
| `id` | UUID, backend-generated |
| `task_id` | correlation id. `send` with `task_id: null` starts a new task (use for `delegate`); replies reuse it |
| `from`, `to` | agent ids |
| `kind` | `delegate` \| `ack` \| `progress` \| `question` \| `result` \| `failure` |
| `payload` | arbitrary JSON |
| `state` | `pending` (initial) \| `delivered` \| `read` \| `done` \| `failed` |
| `timestamp` | unix ms |

`list_messages(task_id)` returns the task's messages in insertion order.

## Tauri API

- `send_message(message: {task_id?, from, to, kind, payload?}) -> Message`; emits `message-received` (payload: `Message`).
- `list_messages(task_id) -> Message[]`
- `mark_message(id, state?, kind?) -> Message`

## Not yet

Delivery to agent PTYs/headless CLIs, retries, routing by agent registry (next steps, see ADR-0002).
