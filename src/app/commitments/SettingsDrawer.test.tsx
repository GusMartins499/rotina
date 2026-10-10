import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SettingsDrawer } from "./SettingsDrawer";
import { createCommitmentAction, deleteCommitmentAction, updateCommitmentAction } from "./actions";

vi.mock("./actions", () => ({
  createCommitmentAction: vi.fn(),
  updateCommitmentAction: vi.fn(),
  deleteCommitmentAction: vi.fn(),
}));

const commitments = [
  { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" },
  { id: 2, name: "Psicólogo", color: "#8250df", dailyMinutes: null, createdAt: "" },
];

const renderDrawer = (children?: ReactNode) =>
  render(
    <SettingsDrawer commitments={commitments} allocatedBlocks={{ 1: 3, 2: 0 }}>
      {children}
    </SettingsDrawer>,
  );

describe("settings drawer", () => {
  it("keeps the drawer closed by default", () => {
    renderDrawer();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the drawer from the gear button", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("names the dialog for assistive technology", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Configurações");
  });

  it("lists the commitments inside the drawer", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByText("TRABALHO")).toBeInTheDocument();
    expect(screen.getByText("Psicólogo")).toBeInTheDocument();
  });

  it("closes the drawer from its close button", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));
    await userEvent.click(screen.getByRole("button", { name: /fechar/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer with Escape", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the drawer when it opens", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("returns focus to the gear button when it closes", async () => {
    renderDrawer();

    const gear = screen.getByRole("button", { name: /configurações/i });
    await userEvent.click(gear);
    await userEvent.keyboard("{Escape}");

    expect(gear).toHaveFocus();
  });

  it("offers to create a commitment from a button", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("button", { name: "Novo compromisso" })).toBeInTheDocument();
  });

  it("hosts the sections given to it", async () => {
    renderDrawer(<p>Rotina base</p>);

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByText("Rotina base")).toBeInTheDocument();
  });
});

const openDrawer = async () => {
  renderDrawer();
  await userEvent.click(screen.getByRole("button", { name: /configurações/i }));
};

const row = (name: RegExp) => screen.getByRole("listitem", { name });

describe("settings drawer: commitments", () => {
  beforeEach(() => {
    vi.mocked(createCommitmentAction).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(updateCommitmentAction).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(deleteCommitmentAction).mockReset().mockResolvedValue({ ok: true });
  });

  it("expands the edit form below the row summary", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));

    const summary = screen.getByTestId("commitment-summary-1");
    const detail = screen.getByTestId("commitment-detail-1");
    expect(within(summary).queryByLabelText(/nome/i)).toBeNull();
    expect(within(detail).getByLabelText(/nome/i)).toHaveValue("TRABALHO");
    expect(summary.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("focuses the name field when the edit opens", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));

    expect(within(row(/TRABALHO/)).getByLabelText(/nome/i)).toHaveFocus();
  });

  it("hides the row actions while it is in edit mode", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));

    expect(within(row(/TRABALHO/)).queryByRole("button", { name: "Editar" })).toBeNull();
    expect(within(row(/TRABALHO/)).queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("edits one commitment at a time", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));
    await userEvent.click(within(row(/Psicólogo/)).getByRole("button", { name: "Editar" }));

    expect(within(row(/TRABALHO/)).queryByLabelText(/nome/i)).toBeNull();
    expect(within(row(/Psicólogo/)).getByLabelText(/nome/i)).toHaveValue("Psicólogo");
  });

  it("returns focus to Editar when the edit is cancelled", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));

    expect(screen.queryByLabelText(/nome/i)).toBeNull();
    expect(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" })).toHaveFocus();
  });

  it("closes the edit form after saving", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(updateCommitmentAction).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: "TRABALHO", dailyMinutes: 480 }),
    );
    expect(screen.queryByLabelText(/nome/i)).toBeNull();
  });

  it("cancels the edit on the first Escape and closes the drawer on the second", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Editar" }));
    await userEvent.keyboard("{Escape}");

    expect(screen.getByRole("dialog", { name: "Configurações" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome/i)).toBeNull();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Configurações" })).toBeNull();
  });

  it("keeps the new-commitment form collapsed until asked", async () => {
    await openDrawer();

    expect(screen.queryByLabelText(/nome/i)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));

    expect(screen.getByLabelText(/nome/i)).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Novo compromisso" })).toBeNull();
  });

  it("collapses the new-commitment form after saving", async () => {
    await openDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));
    await userEvent.type(screen.getByLabelText(/nome/i), "Academia");
    await userEvent.click(screen.getByRole("button", { name: "Salvar compromisso" }));

    expect(createCommitmentAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Academia" }),
    );
    expect(screen.queryByLabelText(/nome/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Novo compromisso" })).toHaveFocus();
  });

  it("collapses the new-commitment form when cancelled", async () => {
    await openDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByLabelText(/nome/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Novo compromisso" })).toHaveFocus();
  });

  it("keeps the new-commitment form open when the action fails", async () => {
    vi.mocked(createCommitmentAction).mockResolvedValue({ ok: false, error: "banco indisponível" });
    await openDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));
    await userEvent.type(screen.getByLabelText(/nome/i), "Academia");
    await userEvent.click(screen.getByRole("button", { name: "Salvar compromisso" }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue("Academia");
    expect(screen.getByRole("alert")).toHaveTextContent("banco indisponível");
  });

  it("shows the new-commitment form open when there is no commitment yet", async () => {
    render(<SettingsDrawer commitments={[]} allocatedBlocks={{}} />);

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo compromisso" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  });

  it("counts the commitments in the section heading", async () => {
    await openDrawer();

    expect(screen.getByRole("heading", { name: "Compromissos · 2" })).toBeInTheDocument();
  });

  it("renders the delete confirmation inside the card, below the summary", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Excluir" }));

    const confirmation = within(screen.getByTestId("commitment-detail-1")).getByRole("dialog", {
      name: "Excluir TRABALHO",
    });
    expect(confirmation).toHaveTextContent("3 blocos");
    expect(within(confirmation).getByRole("button", { name: "Confirmar exclusão" })).toBeInTheDocument();
    expect(within(confirmation).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    expect(deleteCommitmentAction).not.toHaveBeenCalled();
  });

  it("deletes once the confirmation is accepted", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    expect(deleteCommitmentAction).toHaveBeenCalledWith(1);
  });

  it("returns focus to Excluir when the confirmation is cancelled", async () => {
    await openDrawer();

    await userEvent.click(within(row(/TRABALHO/)).getByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog", { name: "Excluir TRABALHO" })).toBeNull();
    expect(within(row(/TRABALHO/)).getByRole("button", { name: "Excluir" })).toHaveFocus();
  });

  it("deletes a commitment with no allocated block without confirmation", async () => {
    await openDrawer();

    await userEvent.click(within(row(/Psicólogo/)).getByRole("button", { name: "Excluir" }));

    expect(deleteCommitmentAction).toHaveBeenCalledWith(2);
  });

  it("shows the delete failure inside the card", async () => {
    vi.mocked(deleteCommitmentAction).mockResolvedValue({ ok: false, error: "banco indisponível" });
    await openDrawer();

    await userEvent.click(within(row(/Psicólogo/)).getByRole("button", { name: "Excluir" }));

    expect(within(screen.getByTestId("commitment-detail-2")).getByRole("alert")).toHaveTextContent(
      "banco indisponível",
    );
  });

  it("keeps the accessible names the current tests rely on", async () => {
    await openDrawer();

    expect(row(/TRABALHO/)).toHaveAccessibleName("TRABALHO, 8h/dia");
    expect(row(/Psicólogo/)).toHaveAccessibleName("Psicólogo, sem carga diária");
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(2);
  });
});
