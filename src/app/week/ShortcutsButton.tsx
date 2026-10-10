"use client";

import { useRef, useState } from "react";
import { useDismiss } from "./useDismiss";

const SHORTCUTS: [keys: string, gesture: string][] = [
  ["Espaço ou Enter", "pegar e soltar o bloco focado"],
  ["Setas", "mover o bloco pego"],
  ["Shift + ↑ ↓", "redimensionar o bloco focado"],
  ["Delete", "remover o bloco focado"],
  ["Esc", "cancelar o movimento"],
];

function KeyboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShortcutsButton() {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useDismiss({
    open,
    onDismiss: () => {
      setOpen(false);
      if (anchor.current?.contains(document.activeElement) !== false) {
        trigger.current?.focus();
      }
    },
    isInside: (target) => anchor.current?.contains(target) === true,
  });

  return (
    <div className="load-anchor" ref={anchor}>
      <button
        ref={trigger}
        type="button"
        className="chip chip-icon"
        aria-label="Atalhos de teclado"
        aria-expanded={open}
        aria-controls="keyboard-shortcuts"
        onClick={() => setOpen((current) => !current)}
      >
        <KeyboardIcon />
      </button>
      {open && (
        <section id="keyboard-shortcuts" className="weekly-load" aria-label="Atalhos de teclado">
          <h2>Atalhos de teclado</h2>
          <dl className="shortcuts">
            {SHORTCUTS.map(([keys, gesture]) => (
              <div key={keys}>
                <dt>
                  <kbd>{keys}</kbd>
                </dt>
                <dd>{gesture}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
