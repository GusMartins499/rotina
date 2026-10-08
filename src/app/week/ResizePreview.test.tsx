import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { WeekGrid } from "./WeekGrid";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

const trabalho: Commitment = {
  id: 1,
  name: "TRABALHO",
  color: "#d73a4a",
  dailyMinutes: 480,
  createdAt: "",
};

const blocks: PlacedBlock[] = [
  { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
  { id: 2, commitmentId: 1, weekday: 0, startMinute: 540, endMinute: 660 },
];

const renderGrid = () =>
  render(
    <DndContext id="test">
      <WeekGrid blocks={blocks} commitments={[trabalho]} onResize={vi.fn()} />
    </DndContext>,
  );

function stubHeight(testId: string, height: number) {
  const element = screen.getByTestId(testId);
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    height,
    top: 0,
    bottom: height,
    left: 0,
    right: 0,
    width: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  return element;
}

describe("resize preview", () => {
  it("shows no preview before the gesture starts", () => {
    renderGrid();

    expect(screen.queryByTestId("resize-preview")).not.toBeInTheDocument();
  });

  it("shows the candidate size while the edge is dragged", () => {
    renderGrid();
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });

    expect(screen.getByTestId("resize-preview")).toBeInTheDocument();
  });

  it("labels the preview with the candidate hours", () => {
    renderGrid();
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });

    expect(screen.getByTestId("resize-preview")).toHaveTextContent("08:00 às 15:00");
  });

  it("marks the preview as refused when it would overlap", () => {
    renderGrid();
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 3 * 34 });

    expect(screen.getByTestId("resize-preview")).toHaveAttribute("data-refused", "true");
  });

  it("clears the preview when the pointer is released", () => {
    renderGrid();
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });
    fireEvent.pointerUp(window, { clientY: 170 + 2 * 34 });

    expect(screen.queryByTestId("resize-preview")).not.toBeInTheDocument();
  });

  it("clears the preview and keeps the size when the gesture is cancelled", () => {
    const onResize = vi.fn();
    render(
      <DndContext id="test">
        <WeekGrid blocks={blocks} commitments={[trabalho]} onResize={onResize} />
      </DndContext>,
    );
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("resize-preview")).not.toBeInTheDocument();
    expect(onResize).not.toHaveBeenCalled();
  });
})

describe("drop preview on the grid", () => {
  const renderWithDrop = (dropPreview: Parameters<typeof WeekGrid>[0]["dropPreview"]) =>
    render(
      <DndContext id="test">
        <WeekGrid
          blocks={blocks}
          commitments={[trabalho]}
          onResize={vi.fn()}
          dropPreview={dropPreview}
        />
      </DndContext>,
    );

  it("renders the candidate span handed by the board", () => {
    renderWithDrop({ weekday: 3, startMinute: 540, endMinute: 780, refused: false });

    expect(screen.getByTestId("drop-preview")).toHaveTextContent("15:00 às 19:00");
    expect(screen.getByTestId("drop-preview")).toHaveStyle({ gridRow: "19 / 27" });
    expect(screen.getByTestId("drop-preview")).toHaveAttribute("data-refused", "false");
  });

  it("carries the refused state", () => {
    renderWithDrop({ weekday: 0, startMinute: 0, endMinute: 480, refused: true });

    expect(screen.getByTestId("drop-preview")).toHaveAttribute("data-refused", "true");
  });

  it("keeps a span that overflows the day inside the grid", () => {
    renderWithDrop({ weekday: 0, startMinute: 960, endMinute: 1440, refused: true });

    expect(screen.getByTestId("drop-preview")).toHaveStyle({ gridRow: "33 / 35" });
    expect(screen.getByTestId("drop-preview")).toHaveTextContent("22:00 às 23:00");
  });

  it("gives way to an active resize", () => {
    renderWithDrop({ weekday: 3, startMinute: 540, endMinute: 780, refused: false });
    stubHeight("slot-0-0", 17);

    fireEvent.pointerDown(screen.getByTestId("resize-0-120"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });

    expect(screen.getByTestId("resize-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("drop-preview")).not.toBeInTheDocument();
  });

  it("renders nothing without a candidate", () => {
    renderWithDrop(null);

    expect(screen.queryByTestId("drop-preview")).not.toBeInTheDocument();
  });
});
