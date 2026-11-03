//! Persistent message broker (ORKEST-009, milestone 2). Tauri-independent:
//! messages are stored in SQLite and correlated by `task_id`.

use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Delegate,
    Ack,
    Progress,
    Question,
    Result,
    Failure,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum State {
    Pending,
    Delivered,
    Read,
    Done,
    Failed,
}

macro_rules! str_enum {
    ($t:ident { $($v:ident => $s:literal),* }) => {
        impl $t {
            fn as_str(self) -> &'static str { match self { $(Self::$v => $s),* } }
            fn parse(s: &str) -> Result<Self, String> {
                match s { $($s => Ok(Self::$v),)* _ => Err(format!("invalid {}: {s}", stringify!($t))) }
            }
        }
    };
}
str_enum!(Kind { Delegate => "delegate", Ack => "ack", Progress => "progress", Question => "question", Result => "result", Failure => "failure" });
str_enum!(State { Pending => "pending", Delivered => "delivered", Read => "read", Done => "done", Failed => "failed" });

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Message {
    pub id: String,
    pub task_id: String,
    pub from: String,
    pub to: String,
    pub kind: Kind,
    pub payload: serde_json::Value,
    pub state: State,
    pub timestamp: i64, // unix ms
}

/// Input for `send`. `task_id` None => a new task (use for `delegate`).
#[derive(Clone, Debug, Deserialize)]
pub struct NewMessage {
    pub task_id: Option<String>,
    pub from: String,
    pub to: String,
    pub kind: Kind,
    #[serde(default)]
    pub payload: serde_json::Value,
}

pub struct Broker {
    db: Mutex<Connection>,
    /// DB path kept for opening a second connection off-thread (delegate_task).
    path: PathBuf,
}

fn e<E: std::fmt::Display>(x: E) -> String {
    x.to_string()
}

fn row_to_message(r: &Row) -> rusqlite::Result<(Message, String, String)> {
    let payload: String = r.get(5)?;
    Ok((
        Message {
            id: r.get(0)?,
            task_id: r.get(1)?,
            from: r.get(2)?,
            to: r.get(3)?,
            kind: Kind::Delegate,
            payload: serde_json::from_str(&payload).unwrap_or(serde_json::Value::Null),
            state: State::Pending,
            timestamp: r.get(8)?,
        },
        r.get(4)?,
        r.get(6)?,
    ))
}

const COLS: &str = "id, task_id, from_agent, to_agent, kind, payload, state, 0, ts";

impl Broker {
    pub fn open(path: &Path) -> Result<Self, String> {
        Self::init(Connection::open(path).map_err(e)?, Some(path.to_path_buf()))
    }

    #[allow(dead_code)]
    pub fn open_in_memory() -> Result<Self, String> {
        Self::init(Connection::open_in_memory().map_err(e)?, None)
    }

    fn init(conn: Connection, path: Option<PathBuf>) -> Result<Self, String> {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS messages (
               seq INTEGER PRIMARY KEY AUTOINCREMENT,
               id TEXT NOT NULL UNIQUE,
               task_id TEXT NOT NULL,
               from_agent TEXT NOT NULL,
               to_agent TEXT NOT NULL,
               kind TEXT NOT NULL,
               payload TEXT NOT NULL,
               state TEXT NOT NULL,
               ts INTEGER NOT NULL
             );
             CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id, seq);",
        )
        .map_err(e)?;
        Ok(Self {
            db: Mutex::new(conn),
            path: path.unwrap_or_else(|| std::path::PathBuf::from(":memory:")),
        })
    }

    /// The DB path this broker owns (re-opening off-thread uses it).
    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn send(&self, m: NewMessage) -> Result<Message, String> {
        let msg = Message {
            id: uuid::Uuid::new_v4().to_string(),
            task_id: m.task_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            from: m.from,
            to: m.to,
            kind: m.kind,
            payload: m.payload,
            state: State::Pending,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(e)?
                .as_millis() as i64,
        };
        self.db.lock().map_err(e)?.execute(
            "INSERT INTO messages (id, task_id, from_agent, to_agent, kind, payload, state, ts)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                msg.id, msg.task_id, msg.from, msg.to, msg.kind.as_str(),
                msg.payload.to_string(), msg.state.as_str(), msg.timestamp
            ],
        )
        .map_err(e)?;
        Ok(msg)
    }

    fn finish(t: (Message, String, String)) -> Result<Message, String> {
        let (mut m, kind, state) = t;
        m.kind = Kind::parse(&kind)?;
        m.state = State::parse(&state)?;
        Ok(m)
    }

    pub fn get(&self, id: &str) -> Result<Message, String> {
        let db = self.db.lock().map_err(e)?;
        let t = db
            .query_row(&format!("SELECT {COLS} FROM messages WHERE id=?1"), [id], row_to_message)
            .map_err(|x| format!("message {id}: {x}"))?;
        Self::finish(t)
    }

    /// Messages of a task in insertion order.
    pub fn list(&self, task_id: &str) -> Result<Vec<Message>, String> {
        let db = self.db.lock().map_err(e)?;
        let mut st = db
            .prepare(&format!("SELECT {COLS} FROM messages WHERE task_id=?1 ORDER BY seq"))
            .map_err(e)?;
        let rows = st.query_map([task_id], row_to_message).map_err(e)?;
        rows.map(|r| Self::finish(r.map_err(e)?)).collect()
    }

    /// Update state (and optionally kind) of a message.
    pub fn mark(&self, id: &str, state: Option<State>, kind: Option<Kind>) -> Result<Message, String> {
        {
            let db = self.db.lock().map_err(e)?;
            if let Some(s) = state {
                db.execute("UPDATE messages SET state=?1 WHERE id=?2", params![s.as_str(), id]).map_err(e)?;
            }
            if let Some(k) = kind {
                db.execute("UPDATE messages SET kind=?1 WHERE id=?2", params![k.as_str(), id]).map_err(e)?;
            }
        }
        self.get(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn nm(task: Option<&str>, from: &str, to: &str, kind: Kind, p: serde_json::Value) -> NewMessage {
        NewMessage { task_id: task.map(String::from), from: from.into(), to: to.into(), kind, payload: p }
    }

    #[test]
    fn delegate_ack_result_roundtrip_persists_with_correlation() {
        let path = std::env::temp_dir().join(format!("orkest-broker-{}.db", std::process::id()));
        let _ = std::fs::remove_file(&path);
        let (task, ids);
        {
            let b = Broker::open(&path).unwrap();
            let d = b.send(nm(None, "maestro", "builder", Kind::Delegate, json!({"task":"build X"}))).unwrap();
            task = d.task_id.clone();
            let a = b.send(nm(Some(&task), "builder", "maestro", Kind::Ack, json!({}))).unwrap();
            let r = b.send(nm(Some(&task), "builder", "maestro", Kind::Result, json!({"ok":true}))).unwrap();
            // unrelated task must not leak into the correlation
            b.send(nm(None, "maestro", "other", Kind::Delegate, json!({}))).unwrap();
            b.mark(&d.id, Some(State::Done), None).unwrap();
            ids = vec![d.id, a.id, r.id];
        }
        // reopen => persisted
        let b = Broker::open(&path).unwrap();
        let msgs = b.list(&task).unwrap();
        println!("task {task}: {:#?}", msgs.iter().map(|m| (m.kind, m.state, &m.from, &m.to)).collect::<Vec<_>>());
        assert_eq!(msgs.len(), 3);
        assert_eq!(msgs.iter().map(|m| m.id.clone()).collect::<Vec<_>>(), ids);
        assert_eq!(msgs.iter().map(|m| m.kind).collect::<Vec<_>>(), vec![Kind::Delegate, Kind::Ack, Kind::Result]);
        assert!(msgs.iter().all(|m| m.task_id == task));
        assert_eq!(msgs[0].state, State::Done);
        assert_eq!(msgs[2].payload, json!({"ok":true}));
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn mark_unknown_message_errors() {
        let b = Broker::open_in_memory().unwrap();
        assert!(b.mark("nope", Some(State::Read), None).is_err());
    }
}
