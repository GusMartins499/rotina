import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { ShortcutsButton } from "./ShortcutsButton";
import { WeekGrid } from "./WeekGrid";
import type { PlacedBlock } from "./useAllocation";

const block: PlacedBlock = { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 };

const renderWithGrid = () =>
  render(
    <DndContext id="test">
      <ShortcutsButton />
      <WeekGrid
        blocks={[block]}
        commitments={[
          { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" },
        ]}
        onResize={vi.fn()}
        onRemove={vi.fn()}
        onMove={vi.fn()}
      />
    </DndContext>,
  );

const toggle = () => screen.getByRole("button", { name: "Atalhos de teclado" });

describe("keyboard shortcuts", () => {
  it("offers a way to read the shortcuts", async () => {
    renderWithGrid();

    await userEvent.click(toggle());

    const surface = screen.getByRole("region", { name: "Atalhos de teclado" });
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(surface).toHaveTextContent(/pegar/);
    expect(surface).toHaveTextContent(/mover/);
    expect(surface).toHaveTextContent(/redimensionar/);
    expect(surface).toHaveTextContent(/remover/);
    expect(surface).toHaveTextContent(/cancelar/);
  });

  it("closes with Escape", async () => {
    renderWithGrid();

    await userEvent.click(toggle());
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "Atalhos de teclado" })).toBeNull();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
  });

  it("closes when the pointer goes down outside of it", async () => {
    renderWithGrid();

    await userEvent.click(toggle());
    await userEvent.click(document.body);

    expect(screen.queryByRole("region", { name: "Atalhos de teclado" })).toBeNull();
  });

  it("does not steal keys from the grid", async () => {
    renderWithGrid();

    await userEvent.click(toggle());
    await userEvent.click(toggle());
    screen.getByTestId("block-0-120").focus();
    await userEvent.keyboard(" ");

    expect(screen.getByTestId("block-0-120")).toHaveAttribute("aria-grabbed", "true");
  });
});
