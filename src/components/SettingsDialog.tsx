import { CLIS, DEFAULT_MODEL, modelsFor } from "../lib/agents";
import { DEFAULT_SETTINGS, type Settings } from "../lib/settings";
import type { CliAvail } from "../lib/tauri";
import { DialogShell } from "./Dialogs";
import { Listbox } from "./Listbox";
import { Stepper, Toggle } from "./Toggle";
import { NOTIFY_UNAVAILABLE } from "./GearMenu";

const RESTORE_UNAVAILABLE =
  "Indisponível: o app não persiste a lista de agentes; ao abrir, só existe reconnect_session para sessões já abertas.";
const SOUND_UNAVAILABLE = "Indisponível: sem som de aviso implementado.";

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  fontSize: number;
  fontMin: number;
  fontMax: number;
  onFont: (v: number) => void;
  clis: CliAvail[] | null;
  version: string;
  onDiagnostics: () => void;
  onClose: () => void;
  onRestoreFont: () => void;
}

function Row({ label, desc, children, title }: { label: string; desc?: string; children: React.ReactNode; title?: string }) {
  return (
    <div className="ork-set-row" title={title}>
      <div className="ork-set-text">
        <div className="ork-set-label">{label}</div>
        {desc && <div className="ork-set-desc">{desc}</div>}
      </div>
      <div className="ork-set-ctl">{children}</div>
    </div>
  );
}

/** Diálogo de Configurações (S2): coluna única, alterações salvas na hora. */
export function SettingsDialog(p: Props) {
  const s = p.settings;
  const set = (patch: Partial<Settings>) => p.onChange({ ...s, ...patch });
  const visible = p.clis ? CLIS.filter((c) => p.clis!.find((a) => a.key === c.key)?.installed) : CLIS;
  const cliKey = visible.some((c) => c.key === s.defaultCli) ? s.defaultCli : (visible[0]?.key ?? "");
  const cliName = (k: string) => CLIS.find((c) => c.key === k)?.name ?? k;
  const models = modelsFor(cliKey);
  const model = models.includes(s.defaultModel) ? s.defaultModel : DEFAULT_MODEL;

  return (
    <DialogShell
      title="Configurações"
      labelId="ork-settings-title"
      onClose={p.onClose}
      footer={
        <>
          <span className="ork-set-note">As alterações são salvas na hora.</span>
          <button
            className="ork-btn ork-btn-secondary"
            onClick={() => {
              p.onChange({ ...DEFAULT_SETTINGS });
              p.onRestoreFont();
            }}
          >
            Restaurar padrões
          </button>
          <button className="ork-btn ork-btn-primary" onClick={p.onClose}>Fechar</button>
        </>
      }
    >
      <h3 className="ork-section-title">Aparência e terminal</h3>
      <Row label="Tema" desc="Somente o tema escuro existe na V1.">
        <Listbox value="Escuro" options={["Escuro"]} onChange={() => {}} disabled ariaLabel="Tema" />
      </Row>
      <Row label="Fonte do terminal" desc="10–20 px. Independe da interface.">
        <Stepper value={p.fontSize} min={p.fontMin} max={p.fontMax} onChange={p.onFont} label="Fonte do terminal" />
      </Row>
      <Row label="Cursor">
        <div className="ork-segmented" role="radiogroup" aria-label="Cursor">
          {(["block", "bar"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={s.cursor === c}
              className={s.cursor === c ? "is-selected" : ""} onClick={() => set({ cursor: c })}>
              {c === "block" ? "Bloco" : "Barra"}
            </button>
          ))}
        </div>
      </Row>

      <h3 className="ork-section-title">Agentes</h3>
      <Row label="CLI padrão" desc="Pré-selecionado no modal de criação.">
        <Listbox value={cliName(cliKey)} options={visible.map((c) => c.name)} ariaLabel="CLI padrão"
          onChange={(name) => set({ defaultCli: CLIS.find((c) => c.name === name)?.key ?? "", defaultModel: DEFAULT_MODEL })} />
      </Row>
      <Row label="Modelo padrão" desc={`Por CLI; "${DEFAULT_MODEL}" usa o do próprio CLI.`}>
        <Listbox value={model} options={models} ariaLabel="Modelo padrão" onChange={(m) => set({ defaultModel: m })} />
      </Row>
      <Row label="Workspace padrão" desc="Diretório inicial sugerido no modal.">
        <input className="ork-input ork-input-mono" aria-label="Workspace padrão" value={s.defaultWorkspace}
          onChange={(e) => set({ defaultWorkspace: e.target.value })} spellCheck={false} />
      </Row>
      <Row label="Abrir o CLI ao criar o agente" desc="Digita o CLI no terminal após o attach.">
        <Toggle on={s.launchCli} onChange={(v) => set({ launchCli: v })} label="Abrir o CLI ao criar o agente" />
      </Row>
      <Row label="Restaurar agentes ao abrir o app" desc="Reconecta as sessões tmux existentes." title={RESTORE_UNAVAILABLE}>
        <Toggle on={false} disabled label="Restaurar agentes ao abrir o app" title={RESTORE_UNAVAILABLE} />
      </Row>
      <Row label="Confirmar ao fechar agente em execução" desc="Evita encerrar uma tarefa por engano.">
        <Toggle on={s.confirmClose} onChange={(v) => set({ confirmClose: v })} label="Confirmar ao fechar agente em execução" />
      </Row>

      <h3 className="ork-section-title">Avisos</h3>
      <Row label="Notificações do desktop" desc="Quando um agente bloquear ou falhar." title={NOTIFY_UNAVAILABLE}>
        <Toggle on={false} disabled label="Notificações do desktop" title={NOTIFY_UNAVAILABLE} />
      </Row>
      <Row label="Som" desc="Aviso sonoro junto da notificação." title={SOUND_UNAVAILABLE}>
        <Toggle on={false} disabled label="Som" title={SOUND_UNAVAILABLE} />
      </Row>

      <h3 className="ork-section-title">Sistema</h3>
      <Row label="Diagnóstico" desc="Versões e CLIs detectados.">
        <button className="ork-btn ork-btn-secondary ork-btn-sm" onClick={p.onDiagnostics}>Abrir</button>
      </Row>
      <Row label="Versão do Orkest">
        <span className="ork-set-value">v{p.version}</span>
      </Row>
    </DialogShell>
  );
}
