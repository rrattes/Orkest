mod broker;
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
            send_message,
            list_messages,
            mark_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
