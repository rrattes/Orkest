mod sessions;

use sessions::{EventSink, SessionEvent, SessionInfo, SessionManager};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SessionManager::new())
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_input,
            resize_pty,
            close_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
