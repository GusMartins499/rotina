import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { DndContext } from "@dnd-kit/core";
import { WeekGrid } from "./WeekGrid";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" };
const flashcards = { id: 2, name: "FLASHCARDS", color: "#0969da", dailyMinutes: 60, createdAt: "" };

const renderGrid = (blocks: Parameters<typeof WeekGrid>[0]["blocks"] = []) =>
  render(
    <DndContext id="test">
      <WeekGrid blocks={blocks} commitments={[trabalho, flashcards]} onResize={vi.fn()} />
    </DndContext>,
  );

describe("week grid", () => {
  it("renders the seven weekdays", () => {
    renderGrid();

    const days = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

    days.forEach((day, weekday) => {
      expect(screen.getByTestId(`weekday-head-${weekday}`)).toHaveTextContent(day);
    });
  });

  it("renders every hour row from 06:00 to 23:00", () => {
    renderGrid();

    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^hour-label-/)).toHaveLength(17);
  });

  it("renders a block spanning the rows of its duration", () => {
    renderGrid([
      { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
    ]);

    expect(screen.getByTestId("block-0-120")).toHaveStyle({ gridRow: "5 / 15" });
  });

  it("renders a one hour block spanning two rows", () => {
    renderGrid([
      { id: 2, commitmentId: 2, weekday: 1, startMinute: 60, endMinute: 120 },
    ]);

    expect(screen.getByTestId("block-1-60")).toHaveStyle({ gridRow: "3 / 5" });
  });

  it("paints each block with the color of its commitment", () => {
    renderGrid([
      { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
      { id: 2, commitmentId: 2, weekday: 1, startMinute: 60, endMinute: 120 },
    ]);

    expect(screen.getByTestId("block-0-120")).toHaveStyle({ backgroundColor: "#d73a4a" });
    expect(screen.getByTestId("block-1-60")).toHaveStyle({ backgroundColor: "#0969da" });
  });

  it("names each block with its commitment and hours", () => {
    renderGrid([{ id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 }]);

    expect(within(screen.getByTestId("block-0-120")).getByText(/TRABALHO/)).toBeInTheDocument();
    expect(screen.getByTestId("block-0-120")).toHaveAccessibleName(
      "TRABALHO, segunda, 08:00 às 13:00",
    );
  });

  it("concatenates the commitment name with the hours it covers", () => {
    renderGrid([{ id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 }]);

    const block = screen.getByTestId("block-0-120");

    expect(within(block).getByText("TRABALHO")).toBeInTheDocument();
    expect(within(block).getByText("08:00\u201313:00")).toBeInTheDocument();
  });

  it("lays a half hour block out in a single line", () => {
    renderGrid([{ id: 2, commitmentId: 2, weekday: 1, startMinute: 60, endMinute: 90 }]);

    expect(screen.getByTestId("block-1-60")).toHaveAttribute("data-compact", "true");
  });

  it("labels the half hours so a start at 14:30 is readable", () => {
    renderGrid();

    expect(screen.getByText("14:30")).toBeInTheDocument();
  });

  it("offers a drop target for every weekday and half hour", () => {
    renderGrid();

    expect(screen.getAllByTestId(/^slot-/)).toHaveLength(7 * 34);
  });
});

const currentMonday = "2026-10-05";

const renderAt = (props: Partial<ComponentProps<typeof WeekGrid>>) => {
  const grid = (overrides: Partial<ComponentProps<typeof WeekGrid>>) => (
    <DndContext id="test">
      <WeekGrid
        blocks={[]}
        commitments={[trabalho, flashcards]}
        onResize={vi.fn()}
        focusedMonday={currentMonday}
        {...props}
        {...overrides}
      />
    </DndContext>
  );
  const view = render(grid({}));
  return {
    ...view,
    rerenderWith: (overrides: Partial<ComponentProps<typeof WeekGrid>>) =>
      view.rerender(grid(overrides)),
  };
};

const columnOf = (weekday: number) => screen.getByTestId(`weekday-head-${weekday}`).parentElement;

describe("past days", () => {
  it("marks the days before today as past", () => {
    renderAt({ now: "2026-10-07T14:00" });

    expect(columnOf(0)).toHaveAttribute("data-past", "true");
    expect(columnOf(1)).toHaveAttribute("data-past", "true");
    expect(columnOf(2)).not.toHaveAttribute("data-past");
  });

  it("marks the slots before now as past on today's column", () => {
    renderAt({ now: "2026-10-07T14:00" });

    expect(screen.getByTestId("slot-2-180")).toHaveAttribute("data-past", "true");
    expect(screen.getByTestId("slot-2-600")).not.toHaveAttribute("data-past");
  });

  it("marks no day as past on the next week", () => {
    renderAt({ now: "2026-10-11T20:00", focusedMonday: "2026-10-12" });

    for (let weekday = 0; weekday < 7; weekday += 1) {
      expect(columnOf(weekday)).not.toHaveAttribute("data-past");
    }
    expect(screen.getByTestId("slot-0-0")).not.toHaveAttribute("data-past");
  });

  it("renders no past before the clock has ticked", () => {
    renderAt({ now: null });

    expect(columnOf(0)).not.toHaveAttribute("data-past");
  });

  it("keeps past blocks readable", () => {
    renderAt({
      now: "2026-10-07T14:00",
      blocks: [
        {
          id: 1,
          commitmentId: 1,
          weekday: 0,
          startMinute: 120,
          endMinute: 420,
        },
      ],
    });

    const block = screen.getByTestId("block-0-120");

    expect(block).toHaveAttribute("data-past", "true");
    expect(block).not.toHaveStyle({ backgroundColor: "#d73a4a" });
    expect(block).toHaveStyle({ opacity: "1" });
  });

  it("keeps past blocks editable", async () => {
    const onMove = vi.fn();
    renderAt({
      now: "2026-10-07T14:00",
      onMove,
      blocks: [
        {
          id: 1,
          commitmentId: 1,
          weekday: 0,
          startMinute: 120,
          endMinute: 420,
        },
      ],
    });

    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}");

    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), {
      weekday: 4,
      startMinute: 120,
    });
  });

  it("re-evaluates the past as the clock advances", () => {
    const { rerenderWith } = renderAt({ now: "2026-10-07T14:00" });

    expect(screen.getByTestId("slot-2-480")).not.toHaveAttribute("data-past");

    rerenderWith({ now: "2026-10-07T15:05" });

    expect(screen.getByTestId("slot-2-480")).toHaveAttribute("data-past", "true");
  });
});

describe("weekday heading", () => {
  it("shows the day of the month beside the weekday", () => {
    renderAt({ focusedMonday: "2026-10-05" });

    expect(screen.getByTestId("weekday-head-0")).toHaveTextContent("SEG 05");
    expect(screen.getByTestId("weekday-head-6")).toHaveTextContent("DOM 11");
  });

  it("shows the dates of the next week when it is focused", () => {
    renderAt({ now: "2026-10-07T14:00", focusedMonday: "2026-10-12" });

    expect(screen.getByTestId("weekday-head-0")).toHaveTextContent("SEG 12");
    expect(screen.getByTestId("weekday-head-2")).toHaveTextContent("QUA 14");
  });

  it("writes the time of each slot for the mobile hour marks", () => {
    renderGrid();

    expect(screen.getByTestId("slot-0-180")).toHaveAttribute("data-time", "09:00");
    expect(screen.getByTestId("slot-0-210")).toHaveAttribute("data-time", "09:30");
    expect(screen.getByTestId("slot-0-0").parentElement).toHaveAttribute("data-end-time", "23:00");
  });
});
