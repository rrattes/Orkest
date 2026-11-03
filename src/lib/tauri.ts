import { invoke } from "@tauri-apps/api/core";

export interface SessionInfo {
  id: string;
  title: string;
}

export function createSession(agentId: string): Promise<SessionInfo> {
  return invoke<SessionInfo>("create_session", { agentId });
}

export interface CliAvail {
  key: string;
  installed: boolean;
  /** Modo headless (delegate_task) já implementado para este CLI. */
  headless_ready: boolean;
}

/** CLIs realmente instalados no PATH (§7.7). */
export function detectClis(): Promise<CliAvail[]> {
  return invoke<CliAvail[]>("detect_clis");
}

/** Instante (ms) da última entrada do usuário por sessão — distingue eco de saída real. */
export const lastInputAt: Record<string, number> = {};

export function reconnectSession(sessionId: string): Promise<void> {
  return invoke<void>("reconnect_session", { sessionId });
}

export function writeInput(sessionId: string, data: string): Promise<void> {
  lastInputAt[sessionId] = Date.now();
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

/** Mensagem do broker (espelha src-tauri/src/broker.rs). */
export interface Message {
  id: string;
  task_id: string;
  from: string;
  to: string;
  kind: "delegate" | "ack" | "progress" | "question" | "result" | "failure";
  payload: unknown;
  state: "pending" | "delivered" | "read" | "done" | "failed";
  timestamp: number;
}

export interface Diagnostics {
  app_version: string;
  tmux: string | null; // saída de `tmux -V`; null = não encontrado
}

export function diagnostics(): Promise<Diagnostics> {
  return invoke<Diagnostics>("diagnostics");
}
