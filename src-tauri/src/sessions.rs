//! In-memory PTY session manager (ORKEST-003). Each session runs
//! `tmux new-session -A -s orkest-<id>` inside a PTY; one thread per session
//! pumps PTY output to a sink (Tauri event in-app, a channel in tests).

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Clone, Debug, Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub title: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct SessionOutput {
    pub session_id: String,
    pub data: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct SessionExit {
    pub session_id: String,
    pub code: i32,
}

#[derive(Clone, Debug)]
pub enum SessionEvent {
    Output(SessionOutput),
    Exit(SessionExit),
}

pub type EventSink = Arc<dyn Fn(SessionEvent) + Send + Sync>;

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
    tmux_name: String,
}

#[derive(Default)]
pub struct SessionManager {
    sessions: Mutex<HashMap<String, Session>>,
    /// Optional dedicated tmux socket (`-L`); used by tests to avoid the user's server.
    tmux_socket: Option<String>,
}

fn err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

impl SessionManager {
    pub fn new() -> Self {
        Self::default()
    }

    #[allow(dead_code)]
    pub fn with_tmux_socket(socket: &str) -> Self {
        Self { tmux_socket: Some(socket.to_string()), ..Default::default() }
    }

    fn tmux_base(&self) -> Vec<String> {
        let mut v = vec!["tmux".to_string()];
        if let Some(s) = &self.tmux_socket {
            v.push("-L".into());
            v.push(s.clone());
        }
        v
    }

    pub fn create(&self, agent_id: &str, sink: EventSink) -> Result<SessionInfo, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let tmux_name = format!("orkest-{id}");
        let pair = native_pty_system()
            .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
            .map_err(err)?;

        let mut args = self.tmux_base();
        args.extend(["new-session".into(), "-A".into(), "-s".into(), tmux_name.clone()]);
        // Hide the tmux status bar for THIS session only (session-scoped option,
        // no ~/.tmux.conf, never shows the session UUID). `;` chains a tmux command.
        args.extend([";".into(), "set-option".into(), "status".into(), "off".into()]);
        let mut cmd = CommandBuilder::new(&args[0]);
        cmd.args(&args[1..]);
        cmd.env("TERM", "xterm-256color");
        cmd.env_remove("TMUX"); // allow running from inside another tmux
        let child = pair.slave.spawn_command(cmd).map_err(err)?;
        drop(pair.slave);

        let mut reader = pair.master.try_clone_reader().map_err(err)?;
        let writer = pair.master.take_writer().map_err(err)?;
        let child = Arc::new(Mutex::new(child));

        let sid = id.clone();
        let child_for_thread = child.clone();
        thread::spawn(move || {
            let mut buf = [0u8; 4096];
            let mut pending: Vec<u8> = Vec::new(); // incomplete UTF-8 tail
            loop {
                match reader.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => {
                        pending.extend_from_slice(&buf[..n]);
                        let valid = match std::str::from_utf8(&pending) {
                            Ok(_) => pending.len(),
                            Err(e) if e.error_len().is_none() => e.valid_up_to(),
                            Err(_) => pending.len(), // invalid bytes: lossy
                        };
                        if valid > 0 {
                            let rest = pending.split_off(valid);
                            let data = String::from_utf8_lossy(&pending).into_owned();
                            pending = rest;
                            sink(SessionEvent::Output(SessionOutput { session_id: sid.clone(), data }));
                        }
                    }
                }
            }
            let code = child_for_thread
                .lock()
                .ok()
                .and_then(|mut c| c.wait().ok())
                .map(|s| s.exit_code() as i32)
                .unwrap_or(-1);
            sink(SessionEvent::Exit(SessionExit { session_id: sid, code }));
        });

        self.sessions.lock().map_err(err)?.insert(
            id.clone(),
            Session { master: pair.master, writer, child, tmux_name },
        );
        Ok(SessionInfo { id, title: agent_id.to_string() })
    }

    pub fn write_input(&self, id: &str, data: &str) -> Result<(), String> {
        let mut map = self.sessions.lock().map_err(err)?;
        let s = map.get_mut(id).ok_or_else(|| format!("unknown session {id}"))?;
        s.writer.write_all(data.as_bytes()).map_err(err)?;
        s.writer.flush().map_err(err)
    }

    pub fn resize(&self, id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let map = self.sessions.lock().map_err(err)?;
        let s = map.get(id).ok_or_else(|| format!("unknown session {id}"))?;
        s.master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(err)
    }

    /// Explicit close: kill the tmux session and the attached PTY client.
    pub fn close(&self, id: &str) -> Result<(), String> {
        let s = self
            .sessions
            .lock()
            .map_err(err)?
            .remove(id)
            .ok_or_else(|| format!("unknown session {id}"))?;
        let base = self.tmux_base();
        let _ = std::process::Command::new(&base[0])
            .args(&base[1..])
            .args(["kill-session", "-t", &s.tmux_name])
            .output();
        if let Ok(mut c) = s.child.lock() {
            let _ = c.kill();
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;
    use std::time::{Duration, Instant};

    #[test]
    fn pty_roundtrip_echo() {
        let socket = format!("orkest-test-{}", std::process::id());
        let mgr = SessionManager::with_tmux_socket(&socket);
        let (tx, rx) = mpsc::channel();
        let tx = Mutex::new(tx);
        let sink: EventSink = Arc::new(move |e| {
            let _ = tx.lock().unwrap().send(e);
        });
        let info = mgr.create("test-agent", sink).expect("create");
        assert_eq!(info.title, "test-agent");
        mgr.resize(&info.id, 100, 30).expect("resize");
        std::thread::sleep(Duration::from_millis(500)); // let shell start
        // printf with split literal so the typed command line doesn't itself match
        mgr.write_input(&info.id, "echo orkest-$((40+2))\n").expect("write");

        let mut acc = String::new();
        let deadline = Instant::now() + Duration::from_secs(10);
        while Instant::now() < deadline && !acc.contains("orkest-42") {
            if let Ok(SessionEvent::Output(o)) = rx.recv_timeout(Duration::from_millis(200)) {
                assert_eq!(o.session_id, info.id);
                acc.push_str(&o.data);
            }
        }
        println!("--- PTY output ---\n{acc}\n------------------");
        mgr.close(&info.id).expect("close");
        assert!(!acc.contains(&info.id), "tmux status/UUID leaked into terminal: {acc:?}");
        assert!(acc.contains("orkest-42"), "round-trip failed: {acc:?}");
        // cleanup tmux server on the test socket
        let _ = std::process::Command::new("tmux").args(["-L", &socket, "kill-server"]).output();
    }
}
