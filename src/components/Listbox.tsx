import { useEffect, useRef, useState } from "react";

interface ListboxProps {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6 L8 10 L12 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Listbox custom (substitui <select> nativo), conforme §9.2. */
export function Listbox({
  id,
  value,
  options,
  onChange,
  disabled,
  placeholder,
  ariaLabel,
}: ListboxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  // Rola o item destacado para a vista.
  useEffect(() => {
    if (!open || highlight < 0 || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const idx = options.indexOf(value);

  function openList() {
    setOpen(true);
    setHighlight(idx >= 0 ? idx : 0);
  }

  function commit(i: number) {
    if (i < 0 || i >= options.length) return;
    onChange(options[i]);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setHighlight((h) => Math.min(options.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && highlight >= 0) {
          commit(highlight);
        } else {
          openList();
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className="ork-listbox" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`ork-listbox-trigger${open ? " is-open" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
      >
        <span className={`ork-listbox-value${value ? "" : " is-placeholder"}`}>
          {value || placeholder || ""}
        </span>
        <span className="ork-listbox-chevron">
          <Chevron />
        </span>
      </button>
      {open && (
        <div className="ork-listbox-pop" role="listbox" aria-label={ariaLabel} ref={listRef}>
          {options.map((opt, i) => (
            <div
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`ork-listbox-option${opt === value ? " is-selected" : ""}${
                i === highlight ? " is-highlighted" : ""
              }`}
              onClick={() => commit(i)}
              onMouseEnter={() => setHighlight(i)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
