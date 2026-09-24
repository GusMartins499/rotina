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
  dailyHours: 8,
  createdAt: "",
};

const blocks: PlacedBlock[] = [
  { id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 },
  { id: 2, commitmentId: 1, weekday: 0, startHour: 15, endHour: 17 },
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
    stubHeight("block-0-8", 5 * 34);

    fireEvent.pointerDown(screen.getByTestId("resize-0-8"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });

    expect(screen.getByTestId("resize-preview")).toBeInTheDocument();
  });

  it("labels the preview with the candidate hours", () => {
    renderGrid();
    stubHeight("block-0-8", 5 * 34);

    fireEvent.pointerDown(screen.getByTestId("resize-0-8"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });

    expect(screen.getByTestId("resize-preview")).toHaveTextContent("08:00 às 15:00");
  });

  it("marks the preview as refused when it would overlap", () => {
    renderGrid();
    stubHeight("block-0-8", 5 * 34);

    fireEvent.pointerDown(screen.getByTestId("resize-0-8"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 3 * 34 });

    expect(screen.getByTestId("resize-preview")).toHaveAttribute("data-refused", "true");
  });

  it("clears the preview when the pointer is released", () => {
    renderGrid();
    stubHeight("block-0-8", 5 * 34);

    fireEvent.pointerDown(screen.getByTestId("resize-0-8"), { clientY: 170 });
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
    stubHeight("block-0-8", 5 * 34);

    fireEvent.pointerDown(screen.getByTestId("resize-0-8"), { clientY: 170 });
    fireEvent.pointerMove(window, { clientY: 170 + 2 * 34 });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("resize-preview")).not.toBeInTheDocument();
    expect(onResize).not.toHaveBeenCalled();
  });
})
