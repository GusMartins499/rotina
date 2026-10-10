"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Commitment } from "../../repository/schema";
import { CommitmentList } from "./CommitmentList";
import { DeleteConfirmation, needsConfirmation } from "./DeleteCommitmentButton";
import { EditCommitmentForm } from "./EditCommitmentButton";
import { NewCommitment } from "./NewCommitment";
import { deleteCommitmentAction, updateCommitmentAction } from "./actions";
import type { CommitmentInput } from "../../domain/commitment";
import { useDismiss } from "../week/useDismiss";

type Props = {
  commitments: Commitment[];
  allocatedBlocks: Record<number, number>;
  children?: ReactNode;
};

type Expanded = { id: number; mode: "edit" | "delete" };

type DeleteError = { id: number; message: string };

const NEW_COMMITMENT_TRIGGER = "new";

function triggerKey(mode: Expanded["mode"], id: number): string {
  return `${mode}-${id}`;
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Expanded | null>(null);
  const [deleteError, setDeleteError] = useState<DeleteError | null>(null);
  const drawer = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (key !== null) {
      pendingFocus.current = null;
      drawer.current?.querySelector<HTMLElement>(`[data-focus-key="${key}"]`)?.focus();
    }
  });

  useEffect(() => {
    if (open) {
      closeButton.current?.focus();
      return undefined;
    }

    return undefined;
  }, [open]);

  function close() {
    setOpen(false);
    setCreating(false);
    setExpanded(null);
    setDeleteError(null);
    gear.current?.focus();
  }

  function stopCreating() {
    setCreating(false);
    pendingFocus.current = NEW_COMMITMENT_TRIGGER;
  }

  function openDetail(next: Expanded) {
    setDeleteError(null);
    setExpanded(next);
  }

  function closeDetail() {
    if (expanded !== null) {
      pendingFocus.current = triggerKey(expanded.mode, expanded.id);
    }
    setExpanded(null);
  }

  async function remove(id: number) {
    setExpanded(null);
    setDeleteError(null);
    const result = await deleteCommitmentAction(id);
    if (!result.ok) {
      setDeleteError({ id, message: result.error });
      return;
    }
    pendingFocus.current = NEW_COMMITMENT_TRIGGER;
  }

  function requestDelete(commitment: Commitment) {
    if (needsConfirmation(allocatedBlocks[commitment.id] ?? 0)) {
      openDetail({ id: commitment.id, mode: "delete" });
      return;
    }
    void remove(commitment.id);
  }

  function renderActions(commitment: Commitment) {
    if (expanded?.id === commitment.id) {
      return null;
    }

    return (
      <>
        <button
          data-focus-key={triggerKey("edit", commitment.id)}
          type="button"
          className="icon-button"
          aria-label="Editar"
          title="Editar"
          onClick={() => openDetail({ id: commitment.id, mode: "edit" })}
        >
          <PencilIcon />
        </button>
        <button
          data-focus-key={triggerKey("delete", commitment.id)}
          type="button"
          className="icon-button"
          aria-label="Excluir"
          title="Excluir"
          onClick={() => requestDelete(commitment)}
        >
          <TrashIcon />
        </button>
      </>
    );
  }

  function renderDetail(commitment: Commitment) {
    if (expanded?.id === commitment.id && expanded.mode === "edit") {
      return (
        <EditCommitmentForm
          value={{
            name: commitment.name,
            color: commitment.color as CommitmentInput["color"],
            dailyMinutes: commitment.dailyMinutes,
          }}
          onSave={(input) => updateCommitmentAction(commitment.id, input)}
          onClose={closeDetail}
        />
      );
    }

    if (expanded?.id === commitment.id && expanded.mode === "delete") {
      return (
        <DeleteConfirmation
          name={commitment.name}
          allocatedBlocks={allocatedBlocks[commitment.id] ?? 0}
          onConfirm={() => void remove(commitment.id)}
          onCancel={closeDetail}
        />
      );
    }

    if (deleteError?.id === commitment.id) {
      return <p role="alert">{deleteError.message}</p>;
    }

    return null;
  }

  const showNewForm = creating || commitments.length === 0;

  useDismiss({ open, onDismiss: close });

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
            ref={drawer}
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

            <section className="settings-group" aria-labelledby="settings-commitments">
              <div className="settings-group-head">
                <h3 id="settings-commitments">
                  Compromissos <span className="settings-count">· {commitments.length}</span>
                </h3>
                {!showNewForm && (
                  <button
                    data-focus-key={NEW_COMMITMENT_TRIGGER}
                    type="button"
                    className="settings-add"
                    onClick={() => setCreating(true)}
                  >
                    <span aria-hidden="true">+</span> Novo compromisso
                  </button>
                )}
              </div>

              {showNewForm && (
                <div className="commitment-card commitment-new" data-expanded="true">
                  <NewCommitment
                    autoFocus={creating}
                    onDone={stopCreating}
                    onCancel={commitments.length === 0 ? undefined : stopCreating}
                  />
                </div>
              )}

              <CommitmentList
                commitments={commitments}
                expandedId={expanded?.id ?? null}
                renderActions={renderActions}
                renderDetail={renderDetail}
              />
            </section>

            {children !== undefined && <div className="settings-section">{children}</div>}
          </section>
        </>
      )}
    </>
  );
}
