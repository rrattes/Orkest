import type { AgentDefinition, AgentType } from "../types";

export interface CliOption {
  key: string;
  name: string;
  models: string[];
}

/** CLI disponíveis no modal (4 opções, §4.3). Modelos são placeholders estáticos
 *  (a leitura dinâmica da lista de modelos é decisão aberta §7.7). */
export const CLIS: CliOption[] = [
  {
    key: "claude",
    name: "Claude Code",
    models: ["Opus 4.5", "Sonnet 4.5", "Haiku 4.5"],
  },
  {
    key: "codex",
    name: "Codex",
    models: ["GPT-5.2", "GPT-5.2 Mini"],
  },
  {
    key: "opencode",
    name: "OpenCode",
    models: ["DeepSeek V4", "Claude Sonnet 4.5"],
  },
  {
    key: "gemini",
    name: "Gemini CLI",
    models: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"],
  },
];

export const DEFAULT_MODEL = "Padrão do CLI";

export function modelsFor(cliKey: string): string[] {
  const cli = CLIS.find((c) => c.key === cliKey);
  return [DEFAULT_MODEL, ...(cli?.models ?? [])];
}

export interface RoleOption {
  label: string;
  desc: string;
}

/** Roles de exemplo (persistência de roles é marco posterior; §7.4). */
export const ROLES: RoleOption[] = [
  {
    label: "Revisor de código",
    desc: "Revisa diffs e aponta problemas de correção, legibilidade e segurança.",
  },
  {
    label: "Debugger",
    desc: "Investiga falhas, reproduz erros e propõe correções com evidência.",
  },
  {
    label: "DevOps",
    desc: "Cuida de CI/CD, infraestrutura e automação de deploys.",
  },
  {
    label: "Pesquisador",
    desc: "Pesquisa tópicos, compara fontes e sintetiza relatórios.",
  },
];

let agentSeq = 0;

export function newAgentId(): string {
  agentSeq += 1;
  return `agent-${Date.now().toString(36)}-${agentSeq}`;
}

export function buildAgent(input: {
  id: string;
  name: string;
  cliKey: string;
  model: string;
  workspace: string;
  icon: number;
  identityColor: number;
  type: AgentType;
  role: string;
}): AgentDefinition {
  const cli = CLIS.find((c) => c.key === input.cliKey);
  return {
    id: input.id,
    name: input.name,
    cli: input.cliKey,
    cliName: cli?.name ?? input.cliKey,
    model: input.model || DEFAULT_MODEL,
    workspace: input.workspace,
    icon: input.icon,
    identityColor: input.identityColor,
    type: input.type,
    role: input.role,
  };
}
