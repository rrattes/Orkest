export function Toggle({ on, onChange, disabled, label, title }: {
  on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string; title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={title}
      disabled={disabled}
      className={`ork-switch${on ? " is-on" : ""}`}
      onClick={() => onChange?.(!on)}
    />
  );
}

export function Stepper({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (v: number) => void; label: string;
}) {
  return (
    <span className="ork-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Diminuir" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <b>{value}</b>
      <button type="button" aria-label="Aumentar" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}
