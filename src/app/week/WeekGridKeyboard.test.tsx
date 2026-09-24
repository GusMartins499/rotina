import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const flashcards: Commitment = {
  id: 2,
  name: "FLASHCARDS",
  color: "#0969da",
  dailyMinutes: 60,
  createdAt: "",
};

const blocks: PlacedBlock[] = [
  { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
  { id: 2, commitmentId: 2, weekday: 0, startMinute: 840, endMinute: 900 },
  { id: 3, commitmentId: 2, weekday: 1, startMinute: 180, endMinute: 240 },
];

const renderGrid = (
  handlers: {
    onResize?: (block: PlacedBlock, endMinute: number) => void;
    onRemove?: (block: PlacedBlock) => void;
    onMove?: (block: PlacedBlock, to: { weekday: number; startMinute: number }) => void;
  } = {},
) =>
  render(
    <DndContext id="test">
      <WeekGrid
        blocks={blocks}
        commitments={[trabalho, flashcards]}
        onResize={handlers.onResize ?? vi.fn()}
        onRemove={handlers.onRemove ?? vi.fn()}
        onMove={handlers.onMove ?? vi.fn()}
      />
    </DndContext>,
  );

describe("keyboard operable grid", () => {
  it("gives every allocated block a focusable handle in reading order", async () => {
    renderGrid();

    await userEvent.tab();
    expect(screen.getByTestId("block-0-120")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByTestId("block-0-840")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByTestId("block-1-180")).toHaveFocus();
  });

  it("exposes each block with an accessible name carrying commitment and time", () => {
    renderGrid();

    expect(screen.getByTestId("block-0-120")).toHaveAccessibleName(
      "TRABALHO, segunda, 08:00 às 13:00",
    );
  });

  it("resizes a focused block by one step with Shift and the arrow keys", async () => {
    const onResize = vi.fn();
    renderGrid({ onResize });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");

    expect(onResize).toHaveBeenCalledWith(blocks[0], 390);
  });

  it("grows a focused block with Shift and ArrowDown", async () => {
    const onResize = vi.fn();
    renderGrid({ onResize });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(onResize).toHaveBeenCalledWith(blocks[0], 450);
  });

  it("removes a focused block with Delete", async () => {
    const onRemove = vi.fn();
    renderGrid({ onRemove });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{Delete}");

    expect(onRemove).toHaveBeenCalledWith(blocks[0]);
  });

  it("does not resize when the arrow keys are pressed without Shift", async () => {
    const onResize = vi.fn();
    renderGrid({ onResize });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{ArrowUp}");

    expect(onResize).not.toHaveBeenCalled();
  });

  it("picks up a focused block with Space and drops it with Space", async () => {
    const onMove = vi.fn();
    renderGrid({ onMove });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");

    expect(onMove).toHaveBeenCalledWith(blocks[0], { weekday: 1, startMinute: 120 });
  });

  it("marks the grabbed block while it is picked up", async () => {
    renderGrid();

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");

    expect(screen.getByTestId("block-0-120")).toHaveAttribute("aria-grabbed", "true");
  });

  it("highlights the slot the cursor is over", async () => {
    renderGrid();

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByTestId("slot-1-120")).toHaveAttribute("data-cursor", "true");
  });

  it("cancels a keyboard drag with Escape leaving the block untouched", async () => {
    const onMove = vi.fn();
    renderGrid({ onMove });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Escape}");

    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByTestId("block-0-120")).toHaveAttribute("aria-grabbed", "false");
  });

  it("does not move when the block is dropped where it started", async () => {
    const onMove = vi.fn();
    renderGrid({ onMove });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard(" ");

    expect(onMove).not.toHaveBeenCalled();
  });

  it("keeps focus on the block after it is dropped", async () => {
    renderGrid();

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");

    expect(screen.getByTestId("block-0-120")).toHaveFocus();
  });

  it("ignores arrow keys when no block is grabbed", async () => {
    renderGrid();

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.queryByTestId("slot-1-120")).not.toHaveAttribute("data-cursor");
  });

  it("keeps slots out of the tab order", async () => {
    renderGrid();

    expect(screen.getByTestId("slot-3-240")).not.toHaveAttribute("tabindex");
  });
});
