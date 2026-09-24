import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyHours: 8, createdAt: "" };
const psicologo = { id: 2, name: "Psicólogo", color: "#8250df", dailyHours: null, createdAt: "" };

describe("weekly load panel", () => {
  it("sums the weekly hours of each commitment", () => {
    render(
      <WeeklyLoadPanel
        commitments={[trabalho]}
        blocks={[
          { id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 },
          { id: 2, commitmentId: 1, weekday: 0, startHour: 14, endHour: 17 },
          { id: 3, commitmentId: 1, weekday: 1, startHour: 8, endHour: 16 },
        ]}
      />,
    );

    expect(screen.getByTestId("weekly-load-1")).toHaveTextContent("16h");
  });

  it("shows zero for a commitment with no blocks", () => {
    render(<WeeklyLoadPanel commitments={[psicologo]} blocks={[]} />);

    expect(screen.getByTestId("weekly-load-2")).toHaveTextContent("0h");
  });

  it("lists every commitment, with or without daily load", () => {
    render(<WeeklyLoadPanel commitments={[trabalho, psicologo]} blocks={[]} />);

    expect(screen.getByTestId("weekly-load-1")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-load-2")).toBeInTheDocument();
  });
});
