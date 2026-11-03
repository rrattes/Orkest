mod broker;
mod delegation;
mod sessions;

use broker::{Broker, Kind, Message, NewMessage, State as MsgState};

use sessions::{EventSink, SessionEvent, SessionInfo, SessionManager};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};

#[tauri::command]
fn create_session(
    agent_id: String,
    app: AppHandle,
    state: State<'_, SessionManager>,
) -> Result<SessionInfo, String> {
    let sink: EventSink = Arc::new(move |ev| {
        let _ = match ev {
            SessionEvent::Output(o) => app.emit("session-output", o),
            SessionEvent::Exit(x) => app.emit("session-exit", x),
        };
    });
    state.create(&agent_id, sink)
}

#[tauri::command]
fn reconnect_session(
    session_id: String,
    app: AppHandle,
    state: State<'_, SessionManager>,
) -> Result<(), String> {
    let sink: EventSink = Arc::new(move |ev| {
        let _ = match ev {
            SessionEvent::Output(o) => app.emit("session-output", o),
            SessionEvent::Exit(x) => app.emit("session-exit", x),
        };
    });
    state.reconnect(&session_id, sink)
}

#[tauri::command]
fn write_input(session_id: String, data: String, state: State<'_, SessionManager>) -> Result<(), String> {
    state.write_input(&session_id, &data)
}

#[tauri::command]
fn resize_pty(session_id: String, cols: u16, rows: u16, state: State<'_, SessionManager>) -> Result<(), String> {
    state.resize(&session_id, cols, rows)
}

#[tauri::command]
fn close_session(session_id: String, state: State<'_, SessionManager>) -> Result<(), String> {
    state.close(&session_id)
}

#[tauri::command]
fn send_message(message: NewMessage, app: AppHandle, broker: State<'_, Broker>) -> Result<Message, String> {
    let m = broker.send(message)?;
    let _ = app.emit("message-received", &m);
    Ok(m)
}

#[tauri::command]
fn list_messages(task_id: String, broker: State<'_, Broker>) -> Result<Vec<Message>, String> {
    broker.list(&task_id)
}

#[tauri::command]
fn mark_message(
    id: String,
    state: Option<MsgState>,
    kind: Option<Kind>,
    broker: State<'_, Broker>,
) -> Result<Message, String> {
    broker.mark(&id, state, kind)
}

/// ORKEST-M2-1: one delegation round-trip. `async` so the long headless CLI run
/// cannot freeze the UI thread; the flow runs on the blocking thread-pool with a
/// second SQLite connection on the same DB (no PTY, no tmux — ADR-0002).
#[tauri::command]
async fn delegate_task(
    args: delegation::DelegateArgs,
    broker: State<'_, Broker>,
) -> Result<delegation::DelegateOutcome, String> {
    let db_path = broker.path().to_path_buf();
    let timeout_ms = args.timeout_ms.unwrap_or(delegation::DEFAULT_TIMEOUT_MS);
    let runner = move |cli_key: &str, text: &str, cwd: &std::path::Path| -> Result<String, String> {
        let argv = delegation::delegate_cmd(cli_key, text)?;
        delegation::run_headless(&argv, cwd, timeout_ms)
    };
    tauri::async_runtime::spawn_blocking(move || {
        let b = Broker::open(&db_path)?;
        delegation::delegate_flow(&b, &args, &runner)
    })
    .await
    .map_err(|x| format!("join: {x}"))?
}

/// §7.7 (minimum): which CLIs are installed? Pure PATH scan, no PTY.
#[tauri::command]
fn detect_clis() -> Vec<delegation::CliAvail> {
    delegation::detect_clis()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SessionManager::new())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            app.manage(Broker::open(&dir.join("broker.db"))?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_input,
            resize_pty,
            close_session,
            reconnect_session,
            send_message,
            list_messages,
            mark_message,
            delegate_task,
            detect_clis
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
