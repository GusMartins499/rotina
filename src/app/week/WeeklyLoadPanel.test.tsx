import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" };
const psicologo = { id: 2, name: "Psicólogo", color: "#8250df", dailyMinutes: null, createdAt: "" };

describe("weekly load panel", () => {
  it("sums the weekly hours of each commitment", () => {
    render(
      <WeeklyLoadPanel
        commitments={[trabalho]}
        blocks={[
          { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
          { id: 2, commitmentId: 1, weekday: 0, startMinute: 480, endMinute: 660 },
          { id: 3, commitmentId: 1, weekday: 1, startMinute: 120, endMinute: 600 },
        ]}
      />,
    );

    expect(screen.getByTestId("weekly-load-1")).toHaveTextContent("16h");
  });

  it("shows zero for a commitment with no blocks", () => {
    render(<WeeklyLoadPanel commitments={[psicologo]} blocks={[]} />);

    expect(screen.getByTestId("weekly-load-2")).toHaveTextContent("0min");
  });

  it("lists every commitment, with or without daily load", () => {
    render(<WeeklyLoadPanel commitments={[trabalho, psicologo]} blocks={[]} />);

    expect(screen.getByTestId("weekly-load-1")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-load-2")).toBeInTheDocument();
  });
});
