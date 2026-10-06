import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SettingsDrawer } from "./SettingsDrawer";

const commitments = [
  { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" },
  { id: 2, name: "Psicólogo", color: "#8250df", dailyMinutes: null, createdAt: "" },
];

const renderDrawer = (children?: ReactNode) =>
  render(
    <SettingsDrawer commitments={commitments} allocatedBlocks={{ 1: 3, 2: 0 }}>
      {children}
    </SettingsDrawer>,
  );

describe("settings drawer", () => {
  it("keeps the drawer closed by default", () => {
    renderDrawer();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the drawer from the gear button", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("names the dialog for assistive technology", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Configurações");
  });

  it("lists the commitments inside the drawer", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByText("TRABALHO")).toBeInTheDocument();
    expect(screen.getByText("Psicólogo")).toBeInTheDocument();
  });

  it("closes the drawer from its close button", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));
    await userEvent.click(screen.getByRole("button", { name: /fechar/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the drawer with Escape", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the drawer when it opens", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("returns focus to the gear button when it closes", async () => {
    renderDrawer();

    const gear = screen.getByRole("button", { name: /configurações/i });
    await userEvent.click(gear);
    await userEvent.keyboard("{Escape}");

    expect(gear).toHaveFocus();
  });

  it("offers the form to create a commitment", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
  });

  it("hosts the sections given to it", async () => {
    renderDrawer(<p>Rotina base</p>);

    await userEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(screen.getByText("Rotina base")).toBeInTheDocument();
  });
})
