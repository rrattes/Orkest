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
  modelNote?: string; // aviso quando o modelo escolhido não pôde ser aplicado
}

/** Causa de um bloqueio derivada de uma mensagem `question` pendente no broker. */
export interface Blocker {
  kind: "user" | "agent"; // user = pergunta ao orkest-ui (B1); agent = a outro agente (B2)
  agent: string | null; // agente que deve responder (B2)
  taskId: string;
  questionId: string;
}

export interface Tab {
  sessionId: string; // id de sessão gerado pelo backend
  title: string; // título retornado por create_session
  agent: AgentDefinition;
  status: SessionStatus;
  exitCode: number | null;
  unseen: boolean;
  exitSignal: string | null; // sinal que encerrou o cliente PTY (F2)
  disconnected: boolean; // cliente PTY caiu mas a sessão tmux vive (F4)
  blocker: Blocker | null; // causa do estado blocked (B1/B2)
  notice: string | null; // erro de uma ação do banner (ex.: Reconectar falhou)
}

/** Rótulo textual coerente com o banner (V-34). */
export function tabStatusLabel(t: Pick<Tab, "status" | "disconnected">): string {
  return t.disconnected ? "Desconectada" : STATUS_LABELS[t.status];
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
