import { invoke } from "@tauri-apps/api/core";

export interface SessionInfo {
  id: string;
  title: string;
}

export function createSession(agentId: string): Promise<SessionInfo> {
  return invoke<SessionInfo>("create_session", { agentId });
}

export function writeInput(sessionId: string, data: string): Promise<void> {
  return invoke<void>("write_input", { sessionId, data });
}

export function resizePty(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  return invoke<void>("resize_pty", { sessionId, cols, rows });
}

export function closeSession(sessionId: string): Promise<void> {
  return invoke<void>("close_session", { sessionId });
}
