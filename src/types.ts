export type AgentType = "maestro" | "especialista";

export type SessionStatus = "idle" | "running" | "done" | "blocked" | "failed";

export interface AgentDefinition {
  id: string;
  name: string;
  cli: string; // chave do CLI (claude | codex | opencode | gemini)
  cliName: string; // nome de exibição do CLI
  model: string; // rótulo do modelo (ex.: "Padrão do CLI")
  workspace: string;
  icon: number; // índice do glifo de identidade (0..15)
  identityColor: number; // índice da cor de identidade (0..7)
  type: AgentType;
  role: string; // rótulo da role (vazio = sem role)
}

export interface Tab {
  sessionId: string; // id de sessão gerado pelo backend
  title: string; // título retornado por create_session
  agent: AgentDefinition;
  status: SessionStatus;
  exitCode: number | null;
  unseen: boolean;
}

/** Rótulo textual de cada estado (vocabulário único, §4.5). */
export const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: "Ocioso",
  running: "Executando",
  done: "Concluído",
  blocked: "Bloqueado",
  failed: "Falhou",
};

/** Cor de cada estado — sempre referenciada via token CSS (nunca hex em componente). */
export const STATUS_COLOR: Record<SessionStatus, string> = {
  idle: "var(--ork-neutral)",
  running: "var(--ork-accent)",
  done: "var(--ork-success)",
  blocked: "var(--ork-attention)",
  failed: "var(--ork-error)",
};
