import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeekBoard } from "./WeekBoard";
import type { PlacedBlock } from "./useAllocation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const ok = () => vi.fn().mockResolvedValue({ ok: true });

const renderBoard = (initialBlocks: PlacedBlock[]) =>
  render(
    <WeekBoard
      weekLabel="Semana do dia 05/10 até 11/10 de 2026"
      focusedMonday="2026-10-05"
      focus="current"
      today="2026-10-10"
      commitments={[
        { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" },
      ]}
      allocatedBlocks={{}}
      initialBlocks={initialBlocks}
      allocate={vi.fn()}
      move={ok()}
      resize={ok()}
      remove={ok()}
      saveTemplate={ok()}
      applyTemplate={ok()}
      hasTemplate
    />,
  );

describe("empty week on the board", () => {
  it("shows guidance when the focused week has no blocks", () => {
    renderBoard([]);

    expect(screen.getByTestId("empty-week")).toBeInTheDocument();
  });

  it("renders no empty state once the week has a block", () => {
    renderBoard([{ id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 }]);

    expect(screen.queryByTestId("empty-week")).toBeNull();
  });

});
