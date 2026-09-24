import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PALETTE } from "../../domain/commitment";
import { EditCommitmentButton } from "./EditCommitmentButton";

const trabalho = { name: "TRABALHO", color: PALETTE[0], dailyMinutes: 480 };

describe("edit commitment button", () => {
  it("opens a form filled with the current values", async () => {
    render(<EditCommitmentButton value={trabalho} onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /editar/i }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue("TRABALHO");
    expect(screen.getByLabelText(/carga/i)).toHaveValue("8");
  });

  it("saves the edited values", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(<EditCommitmentButton value={trabalho} onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO REMOTO");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "TRABALHO REMOTO", dailyMinutes: 480 }),
    );
  });

  it("closes the form after saving", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(<EditCommitmentButton value={trabalho} onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });

  it("discards the changes when cancelled", async () => {
    const onSave = vi.fn();
    render(<EditCommitmentButton value={trabalho} onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), "OUTRO");
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });
});
