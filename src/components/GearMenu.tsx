import { useEffect, useRef } from "react";
import { KeyboardIcon, GearIcon, PulseIcon, InfoIcon } from "./HeaderIcons";
import { Toggle, Stepper } from "./Toggle";

export const NOTIFY_UNAVAILABLE = "Indisponível: o app ainda não tem plugin de notificação desktop.";

interface Props {
  fontSize: number;
  fontMin: number;
  fontMax: number;
  onFont: (v: number) => void;
  launchCli: boolean;
  onLaunchCli: (v: boolean) => void;
  version: string;
  onSettings: () => void;
  onShortcuts: () => void;
  onDiagnostics: () => void;
  onAbout: () => void;
  onClose: () => void;
}

/** Menu rápido da engrenagem (popover de 288px). */
export function GearMenu(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (ref.current && !ref.current.contains(t) && !t?.closest?.("[aria-haspopup='menu']")) p.onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") p.onClose();
    };
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [p]);
  const go = (fn: () => void) => () => {
    p.onClose();
    fn();
  };
  return (
    <div className="ork-pop" role="menu" aria-label="Menu de configuração" ref={ref}>
      <button className="ork-pop-item is-hl" role="menuitem" onClick={go(p.onSettings)}>
        <GearIcon />
        <span>Configurações…</span>
        <kbd>Ctrl+,</kbd>
      </button>
      <hr />
      <div className="ork-pop-cap">TERMINAL</div>
      <div className="ork-pop-row">
        <span className="ork-pop-lb">Fonte do terminal</span>
        <Stepper value={p.fontSize} min={p.fontMin} max={p.fontMax} onChange={p.onFont} label="Fonte do terminal" />
      </div>
      <div className="ork-pop-cap">AGENTES</div>
      <div className="ork-pop-row">
        <span className="ork-pop-lb">Abrir o CLI ao criar o agente</span>
        <Toggle on={p.launchCli} onChange={p.onLaunchCli} label="Abrir o CLI ao criar o agente" />
      </div>
      <div className="ork-pop-row" title={NOTIFY_UNAVAILABLE}>
        <span className="ork-pop-lb is-dim">Avisar quando bloquear ou falhar</span>
        <Toggle on={false} disabled label="Avisar quando bloquear ou falhar" title={NOTIFY_UNAVAILABLE} />
      </div>
      <hr />
      <button className="ork-pop-item" role="menuitem" onClick={go(p.onShortcuts)}>
        <KeyboardIcon />
        <span>Atalhos de teclado</span>
        <kbd>Ctrl+/</kbd>
      </button>
      <button className="ork-pop-item" role="menuitem" onClick={go(p.onDiagnostics)}>
        <PulseIcon />
        <span>Diagnóstico</span>
      </button>
      <button className="ork-pop-item" role="menuitem" onClick={go(p.onAbout)}>
        <InfoIcon />
        <span>Sobre o Orkest · v{p.version}</span>
      </button>
    </div>
  );
}
