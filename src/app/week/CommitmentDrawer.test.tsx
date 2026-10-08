import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { CommitmentDrawer } from "./CommitmentDrawer";
import type { LoadBlock } from "../../domain/load";
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
        blocks={[]}
        focusedDay={null}
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

  it("shows no daily remainder while no day is in focus", () => {
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


const monday = { weekday: 0, isToday: false };
const trabalhoOn = (weekday: number, startMinute: number, endMinute: number): LoadBlock => ({
  commitmentId: 1,
  weekday,
  startMinute,
  endMinute,
});

const renderFocused = (blocks: LoadBlock[], focusedDay = monday) =>
  renderDrawer([trabalho, psicologo], { blocks, focusedDay });

describe("daily remainder", () => {
  it("shows what is missing for the focused day", () => {
    renderFocused([trabalhoOn(0, 120, 420)]);

    expect(screen.getByTestId("remainder-1")).toHaveTextContent("faltam 3h");
  });

  it("shows the goal as met when the day is complete", () => {
    renderFocused([trabalhoOn(0, 120, 600)]);

    expect(screen.getByTestId("remainder-1")).toHaveTextContent("dia completo");
    expect(screen.queryByText(/faltam/)).not.toBeInTheDocument();
  });

  it("shows the excess when the day goes over the goal", () => {
    renderFocused([trabalhoOn(0, 120, 660)]);

    expect(screen.getByTestId("remainder-1")).toHaveTextContent("1h a mais");
  });

  it("reports the excess without alerting", () => {
    renderFocused([trabalhoOn(0, 120, 660)]);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows nothing for a commitment without daily load", () => {
    renderFocused([{ commitmentId: 2, weekday: 0, startMinute: 720, endMinute: 780 }]);

    expect(screen.queryByTestId("remainder-2")).not.toBeInTheDocument();
  });

  it("counts only blocks of the focused day", () => {
    renderFocused([trabalhoOn(0, 120, 600)], { weekday: 1, isToday: true });

    expect(screen.getByTestId("remainder-1")).toHaveTextContent("faltam 8h");
  });

  it("keeps the daily goal visible next to the remainder", () => {
    renderFocused([trabalhoOn(0, 120, 420)]);

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("8h/dia");
  });

  it("updates the remainder as soon as the blocks change", () => {
    const { rerender } = renderFocused([]);
    expect(screen.getByTestId("remainder-1")).toHaveTextContent("faltam 8h");

    rerender(
      <DndContext id="test">
        <CommitmentDrawer
          commitments={[trabalho, psicologo]}
          blocks={[trabalhoOn(0, 120, 360)]}
          focusedDay={monday}
          open
          dragging={false}
          onClose={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByTestId("remainder-1")).toHaveTextContent("faltam 4h");
  });

  it("labels today as the focused day", () => {
    renderFocused([], { weekday: 2, isToday: true });

    expect(screen.getByTestId("drawer-focused-day")).toHaveTextContent("Hoje, quarta");
  });

  it("labels monday when the next week is in focus", () => {
    renderFocused([]);

    expect(screen.getByTestId("drawer-focused-day")).toHaveTextContent("Segunda");
  });
});
