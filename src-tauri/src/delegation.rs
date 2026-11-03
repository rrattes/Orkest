//! Task delegation round-trip (ORKEST-M2-1). Tauri-independent: the flow uses the
//! message broker for persistence/correlation and spawns the agent's CLI in
//! headless mode (ADR-0002: structured I/O from stdio flags, not tmux injection).

use crate::broker::{Broker, Kind, Message, NewMessage, State};
use serde::Serialize;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

/// Input accepted from the UI for one task delegation round-trip.
#[derive(Clone, Debug, serde::Deserialize)]
pub struct DelegateArgs {
    /// Open an existing task (reply lane) or start a new one (None ⇒ new task).
    #[serde(default)]
    pub task_id: Option<String>,
    /// Sender id (the UI: `orkest-ui`).
    pub from: String,
    /// Recipient agent id (for now: the agent name, same key used by `create_session`).
    pub to: String,
    /// Task text handed to the CLI headless prompt.
    pub text: String,
    /// CLI key (`claude | codex | opencode | gemini`).
    pub cli_key: String,
    /// Working directory for the headless run (`~` accepted).
    pub workspace: String,
    #[serde(default)]
    pub timeout_ms: Option<u64>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DelegateOutcome {
    pub task_id: String,
    pub delegate_id: String,
    pub reply_id: Option<String>,
    /// Full correlated message list of the task (insertion order).
    pub messages: Vec<Message>,
}

pub const DEFAULT_TIMEOUT_MS: u64 = 150_000;
const MAX_REPLY_BYTES: usize = 8_000;

/// Headless argv for a CLI key, or a real failure (unsupported this round).
/// Claude only uses one-shot non-interactive `-p` here (text output);
/// stream-json/bidirectional protocol stays on a later round (ADR-0002 risks).
pub fn delegate_cmd(cli_key: &str, text: &str) -> Result<Vec<String>, String> {
    match cli_key {
        "claude" => Ok(vec![
            "claude".into(),
            "-p".into(),
            text.into(),
        ]),
        other => Err(format!(
            "headless mode do CLI '{other}' ainda não suportado (M2 rodada 2)"
        )),
    }
}

/// Expand a leading `~` using $HOME.
pub fn expand_home(path: &str) -> PathBuf {
    if path == "~" {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home);
        }
    }
    if let Some(rest) = path.strip_prefix("~/") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(rest);
        }
    }
    PathBuf::from(path)
}

/// Run a headless CLI command, capturing stdout. Real (bounded) timeout:
/// on deadline the child is killed and an error is returned. No GUI, no PTY —
/// ADR-0002: stdio only for this lane.
pub fn run_headless(argv: &[String], cwd: &Path, timeout_ms: u64) -> Result<String, String> {
    use std::io::Read;
    use std::process::{Command, Stdio};
    if argv.is_empty() {
        return Err("argv vazio".into());
    }
    let mut child = Command::new(&argv[0])
        .args(&argv[1..])
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|x| format!("spawn {}: {x}", argv[0]))?;
    // Read stdout on a side thread so slow producers cannot block the deadline.
    let mut stdout_pipe = child.stdout.take().ok_or("stdout indisponível")?;
    let mut stderr_pipe = child.stderr.take().ok_or("stderr indisponível")?;
    let err_reader = std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stderr_pipe.read_to_end(&mut buf);
        buf
    });
    let reader = std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stdout_pipe.read_to_end(&mut buf);
        buf
    });
    let deadline = Instant::now() + Duration::from_millis(timeout_ms);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let out = reader.join().unwrap_or_default();
                let text = String::from_utf8_lossy(&out).to_string();
                if !status.success() {
                    let se = String::from_utf8_lossy(&err_reader.join().unwrap_or_default()).to_string();
                    let tail: String = se.trim().chars().rev().take(300).collect::<Vec<_>>().into_iter().rev().collect();
                    return Err(format!("exit {}: terminou com status {status}. stderr: {tail}", argv[0]));
                }
                if text.len() > MAX_REPLY_BYTES {
                    return Err("resposta excede o limite de captura".into());
                }
                let trimmed = text.trim();
                if trimmed.is_empty() {
                    return Err(format!("{} não produziu saída", argv[0]));
                }
                return Ok(trimmed.to_string());
            }
            Ok(None) => {
                if Instant::now() >= deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(format!(
                        "timeout do CLI {} após {timeout_ms} ms",
                        argv[0]
                    ));
                }
                std::thread::sleep(Duration::from_millis(60));
            }
            Err(x) => {
                let _ = reader.join();
                return Err(format!("wait {}: {x}", argv[0]));
            }
        }
    }
}

/// One round-trip: `delegate` (persist) → run CLI headless → correlated
/// `result`/`failure` (persist) → correlated list returned to the caller.
/// `runner(cli_key, text, cwd)` is injected so tests and the Tauri layer can swap the CLI;
/// the cli_key drives the spawn (unsupported CLI => real `failure` message).
pub fn delegate_flow(
    broker: &Broker,
    args: &DelegateArgs,
    runner: &dyn Fn(&str, &str, &Path) -> Result<String, String>,
) -> Result<DelegateOutcome, String> {
    if args.text.trim().is_empty() {
        return Err("texto da tarefa vazio".into());
    }
    let cwd = expand_home(&args.workspace);
    let text = normalize_text(&args.text);
    let delegate = broker.send(NewMessage {
        task_id: args.task_id.clone(),
        from: args.from.clone(),
        to: args.to.clone(),
        kind: Kind::Delegate,
        payload: json!({ "text": text }),
    })?;
    let (reply, state) = match runner(&args.cli_key, &text, &cwd) {
        Ok(out) => (
            broker.send(NewMessage {
                task_id: Some(delegate.task_id.clone()),
                from: args.to.clone(),
                to: args.from.clone(),
                kind: Kind::Result,
                payload: json!({ "text": out }),
            })?,
            State::Done,
        ),
        Err(ex) => (
            broker.send(NewMessage {
                task_id: Some(delegate.task_id.clone()),
                from: args.to.clone(),
                to: args.from.clone(),
                kind: Kind::Failure,
                payload: json!({ "error": ex }),
            })?,
            State::Failed,
        ),
    };
    // real state on the delegate message: done/failed with data
    broker.mark(&delegate.id, Some(state), None)?;
    let messages = broker.list(&delegate.task_id)?;
    Ok(DelegateOutcome {
        task_id: delegate.task_id.clone(),
        delegate_id: delegate.id.clone(),
        reply_id: Some(reply.id.clone()),
        messages,
    })
}

/// Trims the prompt handed to the CLI (tests assert on this exact form).
pub fn normalize_text(t: &str) -> String {
    t.trim().to_string()
}

/// Scan $PATH for an executable file (the `which` equivalent, std-only).
pub fn find_in_path(bin: &str) -> bool {
    let paths = match std::env::var("PATH") {
        Ok(p) => p,
        Err(_) => return false,
    };
    for dir in paths.split(':') {
        if dir.is_empty() {
            continue;
        }
        let cand = PathBuf::from(dir).join(bin);
        if let Ok(md) = std::fs::metadata(&cand) {
            if md.is_file() {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if md.permissions().mode() & 0o111 != 0 {
                        return true;
                    }
                }
            }
        }
    }
    false
}

/// CLI keys accepted by the modal (same list as the frontend §4.3).
pub const CLI_KEYS: [&str; 4] = ["claude", "codex", "opencode", "gemini"];

#[derive(Clone, Debug, Serialize)]
pub struct CliAvail {
    pub key: String,
    pub installed: bool,
    /// 'headless' lane already implemented (M2 round 1: claude only).
    pub headless_ready: bool,
}

/// §7.7 (minimum): only actually-installed CLIs feed the modal.
pub fn detect_clis() -> Vec<CliAvail> {
    CLI_KEYS
        .iter()
        .map(|k| CliAvail {
            key: k.to_string(),
            installed: find_in_path(k),
            headless_ready: *k == "claude",
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    fn broker_tmp() -> Broker {
        let dir = std::env::temp_dir();
        let b = Broker::open(&dir.join(format!("orkest-deleg-{}.db", std::process::id()))).unwrap();
        b
    }

    fn args(cli: &str, text: &str) -> DelegateArgs {
        DelegateArgs {
            task_id: None,
            from: "orkest-ui".into(),
            to: "sage".into(),
            text: text.into(),
            cli_key: cli.into(),
            workspace: "~".into(),
            timeout_ms: Some(2_000),
        }
    }

    #[test]
    fn delegate_flow_roundtrip_correlates_and_marks_delegate_done() {
        let b = broker_tmp();
        let runner = |_c: &str, t: &str, _cwd: &Path| {
            Ok(format!("echo[{t}]"))
        };
        let out = delegate_flow(&b, &args("claude", "criar artefato X"), &runner).unwrap();
        let msgs = b.list(&out.task_id).unwrap();
        assert_eq!(msgs.len(), 2);
        assert_eq!(msgs[0].kind, Kind::Delegate);
        assert_eq!(msgs[0].payload["text"], Value::String("criar artefato X".into()));
        assert_eq!(msgs[1].kind, Kind::Result);
        assert_eq!(msgs[1].payload["text"], Value::String("echo[criar artefato X]".into()));
        assert_eq!(msgs[1].from, "sage");
        assert_eq!(msgs[1].to, "orkest-ui");
        let after = b.get(&out.delegate_id).unwrap();
        assert_eq!(after.state, State::Done);
        assert_eq!(after.kind, Kind::Delegate);
    }

    #[test]
    fn delegate_flow_failure_is_real_data_and_correlates() {
        let b = broker_tmp();
        let runner = |_c: &str, _t: &str, _cwd: &Path| Err::<String, String>("spawn claude: binário ausente".to_string());
        let out = delegate_flow(&b, &args("claude", "isto falhará"), &runner).unwrap();
        let msgs = b.list(&out.task_id).unwrap();
        assert_eq!(msgs.len(), 2);
        assert_eq!(msgs[1].kind, Kind::Failure);
        assert!(msgs[1].payload["error"]
            .as_str()
            .unwrap()
            .contains("binário ausente"));
        let del = b.get(&out.delegate_id).unwrap();
        assert_eq!(del.state, State::Failed);
    }

    #[test]
    fn run_headless_echo_captures_stdout_and_respects_workspace() {
        let dir = std::env::temp_dir();
        let argv = vec![
            "sh".to_string(),
            "-c".to_string(),
            "pwd".to_string(),
        ];
        let out = run_headless(&argv, &dir, 3_000).unwrap();
        assert_eq!(out, dir.to_string_lossy().trim_end_matches('/').to_string());
    }

    #[test]
    fn run_headless_timeout_kills_slow_command() {
        let argv = vec!["sleep".to_string(), "2".to_string()];
        let r = run_headless(&argv, &PathBuf::from("/tmp"), 150);
        assert!(r.is_err(), "deve falhar por deadline: {r:?}");
        assert!(r.unwrap_err().contains("timeout"));
    }

    #[test]
    fn delegate_flow_empty_text_is_rejected_without_message() {
        let b = broker_tmp();
        let r = delegate_flow(&b, &args("claude", "   "), &|_, _, _| Ok("x".into()));
        assert!(r.is_err());
    }

    fn real_runner(timeout_ms: u64) -> impl Fn(&str, &str, &Path) -> Result<String, String> {
        move |cli, text, cwd| {
            let argv = match cli {
                // test-only fake "claude" lane so no real CLI is invoked
                "claude" => vec!["sh".into(), "-c".into(), format!("sleep {}; echo ok", text)],
                other => delegate_cmd(other, text)?,
            };
            run_headless(&argv, cwd, timeout_ms)
        }
    }

    #[test]
    fn unsupported_cli_records_real_failure() {
        let b = broker_tmp();
        let out = delegate_flow(&b, &args("codex", "x"), &real_runner(1_000)).unwrap();
        let msgs = b.list(&out.task_id).unwrap();
        assert_eq!(msgs[1].kind, Kind::Failure);
        assert!(msgs[1].payload["error"].as_str().unwrap().contains("codex"));
        assert_eq!(b.get(&out.delegate_id).unwrap().state, State::Failed);
    }

    #[test]
    fn timeout_is_recorded_as_failure() {
        let b = broker_tmp();
        let out = delegate_flow(&b, &args("claude", "3"), &real_runner(200)).unwrap();
        let msgs = b.list(&out.task_id).unwrap();
        assert_eq!(msgs[1].kind, Kind::Failure);
        assert!(msgs[1].payload["error"].as_str().unwrap().contains("timeout"));
        assert_eq!(b.get(&out.delegate_id).unwrap().state, State::Failed);
    }

    #[test]
    fn delegate_cmd_rejects_unsupported_clis() {
        assert!(delegate_cmd("claude", "x").is_ok());
        let r = delegate_cmd("codex", "x");
        assert!(r.is_err());
        let e = r.unwrap_err();
        assert!(e.contains("não suportado"));
    }
}
