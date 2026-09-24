import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteCommitmentButton } from "./DeleteCommitmentButton";

describe("delete commitment button", () => {
  it("deletes without confirmation when nothing is allocated", async () => {
    const onDelete = vi.fn().mockResolvedValue({ ok: true });
    render(
      <DeleteCommitmentButton name="LeetCode" allocatedBlocks={0} onDelete={onDelete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /excluir/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("asks for confirmation naming how many blocks will be removed", async () => {
    const onDelete = vi.fn().mockResolvedValue({ ok: true });
    render(
      <DeleteCommitmentButton name="TRABALHO" allocatedBlocks={5} onDelete={onDelete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /excluir/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/5/);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes once the confirmation is accepted", async () => {
    const onDelete = vi.fn().mockResolvedValue({ ok: true });
    render(
      <DeleteCommitmentButton name="TRABALHO" allocatedBlocks={5} onDelete={onDelete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("keeps the commitment when the confirmation is cancelled", async () => {
    const onDelete = vi.fn();
    render(
      <DeleteCommitmentButton name="TRABALHO" allocatedBlocks={5} onDelete={onDelete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
})
