"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Commitment } from "../../repository/schema";
import { CommitmentList } from "./CommitmentList";
import { DeleteCommitment } from "./DeleteCommitment";
import { EditCommitment } from "./EditCommitment";
import { NewCommitment } from "./NewCommitment";
import type { CommitmentInput } from "../../domain/commitment";

type Props = {
  commitments: Commitment[];
  allocatedBlocks: Record<number, number>;
  children?: ReactNode;
};

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SettingsDrawer({ commitments, allocatedBlocks, children }: Props) {
  const [open, setOpen] = useState(false);
  const gear = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      closeButton.current?.focus();
      return undefined;
    }

    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        gear.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    gear.current?.focus();
  }

  return (
    <>
      <button
        ref={gear}
        type="button"
        className="chip chip-icon"
        aria-label="Configurações"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <GearIcon />
      </button>

      {open && (
        <>
          <div className="scrim" onClick={close} />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Configurações"
            className="settings-drawer"
          >
            <header>
              <h2>Configurações</h2>
              <button ref={closeButton} type="button" onClick={close} aria-label="Fechar">
                ×
              </button>
            </header>

            <h3>Compromissos</h3>

            <NewCommitment />

            <CommitmentList
              commitments={commitments}
              renderActions={(commitment) => (
                <>
                  <EditCommitment
                    id={commitment.id}
                    value={{
                      name: commitment.name,
                      color: commitment.color as CommitmentInput["color"],
                      dailyMinutes: commitment.dailyMinutes,
                    }}
                  />
                  <DeleteCommitment
                    id={commitment.id}
                    name={commitment.name}
                    allocatedBlocks={allocatedBlocks[commitment.id] ?? 0}
                  />
                </>
              )}
            />

            {children !== undefined && <div className="settings-section">{children}</div>}
          </section>
        </>
      )}
    </>
  );
}
