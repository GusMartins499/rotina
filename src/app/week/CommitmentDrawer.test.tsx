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

const renderDrawer = (commitments = [trabalho, psicologo]) =>
  render(
    <DndContext id="test">
      <CommitmentDrawer commitments={commitments} />
    </DndContext>,
  );

describe("commitment drawer", () => {
  it("lists every commitment with its name", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("TRABALHO");
    expect(screen.getByTestId("drawer-commitment-2")).toHaveTextContent("Psicólogo");
  });

  it("paints each item with the commitment color", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveStyle({
      backgroundColor: "#d73a4a",
    });
  });

  it("shows no weekday heading", () => {
    renderDrawer();

    for (const day of ["SEGUNDA", "TERÇA", "DOMINGO"]) {
      expect(screen.queryByText(day)).not.toBeInTheDocument();
    }
  });

  it("shows no daily remainder", () => {
    renderDrawer();

    expect(screen.queryByText(/faltam/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dia completo/i)).not.toBeInTheDocument();
  });

  it("shows the daily load of a commitment that has one", () => {
    renderDrawer();

    expect(screen.getByTestId("drawer-commitment-1")).toHaveTextContent("8h/dia");
  });

  it("shows no load for a commitment without daily hours", () => {
    renderDrawer([psicologo]);

    expect(screen.queryByText(/h\/dia/)).not.toBeInTheDocument();
  });

  it("tells the user when there is no commitment yet", () => {
    renderDrawer([]);

    expect(screen.getByText(/nenhum compromisso/i)).toBeInTheDocument();
  });
})
