import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

    const days = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

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
