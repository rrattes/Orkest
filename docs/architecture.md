# Architecture (initial)

> Working draft — refined as the runtime is validated. See `docs/decisions/`.

## Concepts (formally separated)

| Concept | Meaning |
|---|---|
| **Agent** | Identity: name, icon, CLI, model, Maestro/specialist flag |
| **Role** | Persistent, editable, independent of sessions |
| **Session** | A live terminal (or connection) bound to a workspace |
| **Task** | A unit of delegated work with correlation ID |
| **Workspace** | A working directory |
| **Floor** | An isolated task environment (Git worktree) |
| **Connection** | A communication channel between two agents |

## Topology

Default: **Maestro ↔ specialists**. Direct, optional, authorized connections
between specialists are allowed (including unidirectional).

## Runtime independence

The execution engine (spawning, PTY/tmux, broker, persistence) is a Rust library
with no dependency on the Tauri UI, so it can be tested headlessly.

## Lifecycle principle

Closing the app window must not, by itself, terminate an agent's tasks.
