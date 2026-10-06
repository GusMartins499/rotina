import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { CommitmentDrawer } from "./CommitmentDrawer";
import type { Commitment } from "../../repository/schema";

const trabalho: Commitment = {
  id: 1,
  name: "TRABALHO",
  color: "#d73a4a",
  dailyMinutes: 480,
  createdAt: "",
};
const psicologo: Commitment = {
  id: 2,
  name: "Psicólogo",
  color: "#8250df",
  dailyMinutes: null,
  createdAt: "",
};

const renderDrawer = (
  commitments = [trabalho, psicologo],
  props: Partial<Parameters<typeof CommitmentDrawer>[0]> = {},
) =>
  render(
    <DndContext id="test">
      <CommitmentDrawer
        commitments={commitments}
        open
        dragging={false}
        onClose={vi.fn()}
        {...props}
      />
    </DndContext>,
  );

describe("commitment drawer", () => {
  it("lists every commitment with its name", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("TRABALHO");
    expect(screen.getByTestId("drawer-commitment-2")).toHaveTextContent("Psicólogo");
  });

  it("paints each item with the commitment color", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveStyle({
      backgroundColor: "#d73a4a",
    });
  });

  it("shows no weekday heading", () => {
    renderDrawer();

    for (const day of ["SEGUNDA", "TERÇA", "DOMINGO"]) {
      expect(screen.queryByText(day)).not.toBeInTheDocument();
    }
  });

  it("shows no daily remainder", () => {
    renderDrawer();

    expect(screen.queryByText(/faltam/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dia completo/i)).not.toBeInTheDocument();
  });

  it("shows the daily load of a commitment that has one", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("8h/dia");
  });

  it("shows no load for a commitment without daily hours", () => {
    renderDrawer([psicologo]);

    expect(screen.queryByText(/h\/dia/)).not.toBeInTheDocument();
  });

  it("tells the user when there is no commitment yet", () => {
    renderDrawer([]);

    expect(screen.getByText(/nenhum compromisso/i)).toBeInTheDocument();
  });

  it("stays out of the way while it is closed", () => {
    renderDrawer([trabalho], { open: false });

    expect(screen.getByLabelText("Compromissos")).toHaveAttribute("data-open", "false");
  });

  it("closes itself with Escape", async () => {
    const onClose = vi.fn();
    renderDrawer([trabalho], { onClose });

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes itself when the pointer goes down outside it", async () => {
    const onClose = vi.fn();
    renderDrawer([trabalho], { onClose });

    await userEvent.click(document.body);

    expect(onClose).toHaveBeenCalled();
  });

  it("keeps itself alive while a commitment is being dragged out of it", async () => {
    const onClose = vi.fn();
    renderDrawer([trabalho], { onClose, dragging: true });

    await userEvent.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Compromissos")).toHaveAttribute("data-dragging", "true");
  });
})
