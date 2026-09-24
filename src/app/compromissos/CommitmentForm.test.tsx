import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PALETTE } from "../../domain/commitment";
import { CommitmentForm } from "./CommitmentForm";

describe("commitment form", () => {
  it("submits name, color and daily hours", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO");
    await userEvent.clear(screen.getByLabelText(/carga/i));
    await userEvent.type(screen.getByLabelText(/carga/i), "8");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "TRABALHO",
      color: PALETTE[0],
      dailyHours: 8,
    });
  });

  it("submits a null daily load when the field is left empty", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "Psicólogo");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Psicólogo", dailyHours: null }),
    );
  });

  it("shows an error and creates nothing when the name is empty", async () => {
    const onSubmit = vi.fn();
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/nome/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error and creates nothing when the daily load exceeds the day", async () => {
    const onSubmit = vi.fn();
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO");
    await userEvent.type(screen.getByLabelText(/carga/i), "24");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("surfaces a failure returned by the action", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, error: "banco indisponível" });
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/banco indisponível/i);
  });

  it("clears the form after a successful create", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO");
    await userEvent.type(screen.getByLabelText(/carga/i), "8");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue("");
    expect(screen.getByLabelText(/carga/i)).toHaveValue("");
  });

  it("keeps the typed values when the action fails", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, error: "falhou" });
    render(<CommitmentForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "TRABALHO");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue("TRABALHO");
  });

  it("keeps the values after a successful edit", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(
      <CommitmentForm
        onSubmit={onSubmit}
        initialValue={{ name: "TRABALHO", color: PALETTE[0], dailyHours: 8 }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByLabelText(/nome/i)).toHaveValue("TRABALHO");
  });

  it("gives each rendered form its own field ids", () => {
    render(
      <>
        <CommitmentForm onSubmit={vi.fn()} />
        <CommitmentForm onSubmit={vi.fn()} />
      </>,
    );

    const ids = screen.getAllByLabelText(/nome/i).map((input) => input.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("offers every palette color as a choice", () => {
    render(<CommitmentForm onSubmit={vi.fn()} />);

    expect(screen.getAllByRole("radio")).toHaveLength(PALETTE.length);
  });
});
