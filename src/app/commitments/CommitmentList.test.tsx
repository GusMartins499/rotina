import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PALETTE } from "../../domain/commitment";
import { CommitmentList } from "./CommitmentList";

const trabalho = {
  id: 1,
  name: "TRABALHO",
  color: PALETTE[0],
  dailyHours: 8,
  createdAt: "2026-09-21",
};

const psicologo = {
  id: 2,
  name: "Psicólogo",
  color: PALETTE[4],
  dailyHours: null,
  createdAt: "2026-09-21",
};

describe("commitment list", () => {
  it("shows the daily load of a commitment that has one", () => {
    render(<CommitmentList commitments={[trabalho]} />);

    expect(screen.getByText("8h/dia")).toBeInTheDocument();
  });

  it("shows no load indicator for a commitment without daily hours", () => {
    render(<CommitmentList commitments={[psicologo]} />);

    expect(screen.queryByText(/h\/dia/)).not.toBeInTheDocument();
  });

  it("reflects the color of each commitment", () => {
    render(<CommitmentList commitments={[trabalho, psicologo]} />);

    expect(screen.getByTestId("commitment-color-1")).toHaveStyle({
      backgroundColor: PALETTE[0],
    });
    expect(screen.getByTestId("commitment-color-2")).toHaveStyle({
      backgroundColor: PALETTE[4],
    });
  });

  it("tells the user when there is no commitment yet", () => {
    render(<CommitmentList commitments={[]} />);

    expect(screen.getByText(/nenhum compromisso/i)).toBeInTheDocument();
  });

  it("gives every commitment an accessible name carrying its load", () => {
    render(<CommitmentList commitments={[trabalho]} />);

    expect(screen.getByRole("listitem")).toHaveAccessibleName(/TRABALHO/);
  });
});
