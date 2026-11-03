import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentDefinition, AgentType } from "../types";
import type { CliAvail } from "../lib/tauri";
import { CLIS, DEFAULT_MODEL, ROLES, modelsFor, buildAgent, newAgentId } from "../lib/agents";
import {
  AgentGlyph,
  CloseIcon,
  CliGlyph,
  IDENTITY_COLORS,
  identityVar,
} from "./icons";
import { Listbox } from "./Listbox";

interface CreateAgentModalProps {
  /** Padrões de Configurações > Agentes ("" = sem preferência). */
  defaults: { cli: string; model: string; workspace: string };
  /** CLIs detectados no PATH; null = detecção indisponível (mostra todos). */
  clis: CliAvail[] | null;
  existingNames: string[];
  onCreate: (def: AgentDefinition) => Promise<void>;
  onClose: () => void;
}

const TYPES: { key: AgentType; label: string }[] = [
  { key: "especialista", label: "Especialista" },
  { key: "maestro", label: "Maestro" },
];

export function CreateAgentModal({ defaults, clis, existingNames, onCreate, onClose }: CreateAgentModalProps) {
  const visibleClis = useMemo(
    () => (clis ? CLIS.filter((c) => clis.find((a) => a.key === c.key)?.installed) : CLIS),
    [clis],
  );
  const [cliKey, setCliKey] = useState(
    () => visibleClis.find((c) => c.key === defaults.cli)?.key ?? visibleClis[0]?.key ?? "",
  );
  // Seleciona o primeiro CLI instalado quando a detecção chega/muda.
  useEffect(() => {
    setCliKey((cur) => (visibleClis.some((c) => c.key === cur) ? cur : (visibleClis[0]?.key ?? "")));
  }, [visibleClis]);
  const [model, setModel] = useState(() =>
    modelsFor(cliKey).includes(defaults.model) ? defaults.model : DEFAULT_MODEL,
  );
  const [workspace, setWorkspace] = useState(defaults.workspace || "~");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(0);
  const [identityColor, setIdentityColor] = useState(0);
  const [type, setType] = useState<AgentType>("especialista");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ name: boolean; cli: boolean }>({
    name: false,
    cli: false,
  });

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "Nome é obrigatório.";
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return "Já existe um agente com este nome.";
    }
    return null;
  }, [name, existingNames]);

  const cliError = touched.cli && !cliKey ? "Escolha um CLI." : null;
  const valid = !!name.trim() && !nameError && !!cliKey && !submitting;
  // O erro de nome duplicado aparece AO DIGITAR (sem depender de blur/touch):
  // aborta silenciosamente quando o submit está bloqueado e o usuário não vê o motivo.
  const nameErrorLive = nameError ? touched.name || !!name.trim() : false;

  const suggestedName = useMemo(() => {
    const base = cliKey ? cliKey : "agente";
    return `${base}-${existingNames.length + 1}`;
  }, [cliKey, existingNames.length]);

  function selectCli(key: string) {
    setCliKey(key);
    setModel(DEFAULT_MODEL);
    setTouched((t) => ({ ...t, cli: true }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setTouched({ name: true, cli: true });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const def = buildAgent({
        id: newAgentId(),
        name: name.trim(),
        cliKey,
        model,
        workspace: workspace.trim() || "~",
        icon,
        identityColor,
        type,
        role,
      });
      await onCreate(def);
      // Criação com sucesso: fecha o modal. Sem isso ele fica aberto com o nome já
      // criado e o próximo Enter vira "Já existe..." (BUG reportado pelo usuário).
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ork-scrim">
      <div
        className="ork-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ork-modal-title"
      >
        <div className="ork-modal-header">
          <div>
            <h2 className="ork-modal-title" id="ork-modal-title">
              Novo agente
            </h2>
            <p className="ork-modal-subtitle">
              Escolha o CLI, o modelo e o papel do agente.
            </p>
          </div>
          <button className="ork-modal-close" aria-label="Fechar" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>

        <form className="ork-modal-form" onSubmit={submit} noValidate>
          <div className="ork-modal-body">
            {error && (
              <div className="ork-form-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="ork-form-error-retry"
                  onClick={() => setError(null)}
                >
                  Tentar de novo
                </button>
              </div>
            )}

            <h3 className="ork-section-title">Execução</h3>

            <div className="ork-field">
              <span className="ork-field-label" id="ork-cli-label">
                CLI
              </span>
              <div className="ork-field-body">
                <div
                  className="ork-cli-grid"
                  role="radiogroup"
                  aria-labelledby="ork-cli-label"
                >
                  {visibleClis.map((cli) => (
                    <div
                      key={cli.key}
                      role="radio"
                      aria-checked={cliKey === cli.key}
                      tabIndex={0}
                      className={`ork-cli-card${cliKey === cli.key ? " is-selected" : ""}`}
                      onClick={() => selectCli(cli.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectCli(cli.key);
                        }
                      }}
                    >
                      <span className="ork-cli-glyph">
                        <CliGlyph size={16} />
                      </span>
                      <span>
                        {cli.name}
                        {clis?.find((a) => a.key === cli.key)?.headless_ready ? " · headless" : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {clis && visibleClis.length === 0 && (
                  <span className="ork-error-text" role="alert">
                    Nenhum CLI suportado (claude, codex, opencode, gemini) encontrado no PATH.
                  </span>
                )}
                {cliError && (
                  <span className="ork-error-text" role="alert">
                    {cliError}
                  </span>
                )}
              </div>
            </div>

            <div className="ork-field">
              <label className="ork-field-label" htmlFor="ork-model">
                Modelo
              </label>
              <div className="ork-field-body">
                <Listbox
                  id="ork-model"
                  value={model}
                  options={modelsFor(cliKey)}
                  onChange={setModel}
                  disabled={!cliKey}
                  ariaLabel="Modelo"
                />
              </div>
            </div>

            <div className="ork-field">
              <label className="ork-field-label" htmlFor="ork-workspace">
                Workspace
              </label>
              <div className="ork-field-body">
                <div className="ork-workspace-row">
                  <input
                    id="ork-workspace"
                    className="ork-input ork-input-mono"
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="ork-btn ork-btn-secondary"
                    disabled
                    title="Desabilitado de propósito: o seletor de pasta nativo entra em middleware futuro; o caminho pode ser digitado no campo ao lado."
                    aria-describedby="ork-workspace-help"
                  >
                    Procurar
                  </button>
                </div>
                <span className="ork-help" id="ork-workspace-help">
                  O caminho do workspace aceita ~ e é digitado manualmente; "Procurar" (seletor de
                  pasta nativo) entra em um marco futuro.
                </span>
              </div>
            </div>

            <h3 className="ork-section-title">Identidade</h3>

            <div className="ork-field">
              <label className="ork-field-label" htmlFor="ork-name">
                Nome
              </label>
              <div className="ork-field-body">
                <input
                  id="ork-name"
                  ref={nameRef}
                  className={`ork-input${nameErrorLive ? " is-error" : ""}`}
                  value={name}
                  placeholder={suggestedName}
                  aria-invalid={nameErrorLive && !!nameError}
                  aria-describedby={nameError ? "ork-name-error" : undefined}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  spellCheck={false}
                />
                {nameErrorLive && (
                  <span className="ork-error-text" id="ork-name-error" role="alert">
                    {nameError}
                  </span>
                )}
              </div>
            </div>

            <div className="ork-field">
              <span className="ork-field-label" id="ork-icon-label">
                Ícone
              </span>
              <div className="ork-field-body">
                <div
                  className="ork-icon-grid"
                  role="radiogroup"
                  aria-labelledby="ork-icon-label"
                >
                  {Array.from({ length: 16 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={icon === i}
                      className={`ork-icon-cell${icon === i ? " is-selected" : ""}`}
                      onClick={() => setIcon(i)}
                    >
                      <AgentGlyph glyph={i} size={18} />
                    </button>
                  ))}
                </div>
                <div
                  className="ork-color-row"
                  role="radiogroup"
                  aria-label="Cor de identidade"
                >
                  {IDENTITY_COLORS.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={identityColor === i}
                      aria-label={`Cor ${c}`}
                      className={`ork-color-swatch${identityColor === i ? " is-selected" : ""}`}
                      style={{ backgroundColor: identityVar(c) }}
                      onClick={() => setIdentityColor(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="ork-field">
              <span className="ork-field-label" id="ork-type-label">
                Tipo
              </span>
              <div className="ork-field-body">
                <div className="ork-segmented" role="radiogroup" aria-labelledby="ork-type-label">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={type === t.key}
                      className={type === t.key ? "is-selected" : ""}
                      onClick={() => setType(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <span className="ork-help">
                  {type === "maestro"
                    ? "Coordena outros agentes no workspace."
                    : "Executa tarefas específicas sob coordenação."}
                </span>
              </div>
            </div>

            <div className="ork-field">
              <label className="ork-field-label" htmlFor="ork-role">
                Role
              </label>
              <div className="ork-field-body">
                <Listbox
                  id="ork-role"
                  value={role}
                  options={ROLES.map((r) => r.label)}
                  onChange={setRole}
                  placeholder="Selecionar role…"
                  ariaLabel="Role"
                />
                {role && (
                  <div className="ork-role-preview">
                    {ROLES.find((r) => r.label === role)?.desc ??
                      "Role personalizada (editor fora do escopo desta versão)."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ork-modal-footer">
            <button type="button" className="ork-btn ork-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="ork-btn ork-btn-primary"
              disabled={submitting || !!nameErrorLive || !!cliError}
            >
              {submitting ? "Criando…" : "Criar agente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
