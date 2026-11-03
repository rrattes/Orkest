import { DEFAULT_MODEL } from "./agents";

/** Preferências do usuário (V1 = localStorage; não há tabela de configs no backend). */
export interface Settings {
  cursor: "block" | "bar";
  defaultCli: string; // "" = primeiro CLI instalado
  defaultModel: string;
  defaultWorkspace: string;
  launchCli: boolean; // abrir o CLI do agente ao criar (write_input pós-attach)
  confirmClose: boolean; // confirmar ao fechar agente em execução
}

export const DEFAULT_SETTINGS: Settings = {
  cursor: "block",
  defaultCli: "",
  defaultModel: DEFAULT_MODEL,
  defaultWorkspace: "~",
  launchCli: true,
  confirmClose: true,
};

const KEY = "orkest.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* localStorage indisponível ou JSON inválido */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignora */
  }
}
