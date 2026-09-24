import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { CommitmentDrawer } from "./CommitmentDrawer";

import type { Commitment } from "../../repository/schema";

const trabalho: Commitment = {
  id: 1,
  name: "TRABALHO",
  color: "#d73a4a",
  dailyHours: 8,
  createdAt: "",
};
const psicologo: Commitment = {
  id: 2,
  name: "Psicólogo",
  color: "#8250df",
  dailyHours: null,
  createdAt: "",
};

const renderDrawer = (
  commitments = [trabalho],
  blocks: Parameters<typeof CommitmentDrawer>[0]["blocks"] = [],
  focusedWeekday = 0,
) =>
  render(
    <DndContext id="test">
      <CommitmentDrawer
        commitments={commitments}
        blocks={blocks}
        focusedWeekday={focusedWeekday}
      />
    </DndContext>,
  );

describe("commitment drawer", () => {
  it("shows how many hours are still missing on the focused weekday", () => {
    renderDrawer([trabalho], [{ id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 }]);

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("faltam 3h");
  });

  it("reports the daily load as met when it is fully allocated", () => {
    renderDrawer([trabalho], [{ id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 16 }]);

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent(/completo/i);
  });

  it("reports an excess instead of a negative remainder", () => {
    renderDrawer(
      [trabalho],
      [{ id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 20 }],
    );

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent(/excedeu em 4h/i);
  });

  it("shows no remainder for a commitment without daily hours", () => {
    renderDrawer([psicologo], []);

    expect(screen.getByTestId("drawer-commitment-2")).not.toHaveTextContent(/faltam/i);
  });

  it("counts only the blocks of the focused weekday", () => {
    renderDrawer(
      [trabalho],
      [{ id: 1, commitmentId: 1, weekday: 1, startHour: 8, endHour: 16 }],
      0,
    );

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("faltam 8h");
  });
});
