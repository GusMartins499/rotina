import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyWeek } from "./EmptyWeek";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const ok = () => vi.fn().mockResolvedValue({ ok: true });

describe("empty week", () => {
  it("invites to drag a commitment onto the grid", () => {
    render(<EmptyWeek hasCommitments hasTemplate onApply={ok()} />);

    expect(screen.getByTestId("empty-week")).toHaveTextContent(/arraste/i);
  });

  it("offers to apply the routine template from the empty state", async () => {
    refresh.mockClear();
    const onApply = ok();
    render(<EmptyWeek hasCommitments hasTemplate onApply={onApply} />);

    await userEvent.click(screen.getByRole("button", { name: "Preencher com a rotina base" }));

    expect(onApply).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("surfaces a failure to apply the routine template", async () => {
    refresh.mockClear();
    const onApply = vi.fn().mockResolvedValue({ ok: false, error: "A semana não está vazia." });
    render(<EmptyWeek hasCommitments hasTemplate onApply={onApply} />);

    await userEvent.click(screen.getByRole("button", { name: "Preencher com a rotina base" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A semana não está vazia.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("explains what is missing when no routine template was saved", () => {
    render(<EmptyWeek hasCommitments hasTemplate={false} onApply={ok()} />);

    expect(screen.queryByRole("button", { name: "Preencher com a rotina base" })).toBeNull();
    expect(screen.getByTestId("empty-week-no-template")).toHaveTextContent(
      /salve-a em Configurações/,
    );
  });

  it("points to the commitments setup when there is no commitment yet", () => {
    render(<EmptyWeek hasCommitments={false} hasTemplate onApply={ok()} />);

    expect(screen.getByTestId("empty-week-no-commitment")).toHaveTextContent(
      /cadastrando um compromisso/i,
    );
    expect(screen.getByTestId("empty-week")).not.toHaveTextContent(/arraste/i);
    expect(screen.queryByRole("button", { name: "Preencher com a rotina base" })).toBeNull();
  });

  it("speaks of reading the week and applying the routine on touch screens", () => {
    render(<EmptyWeek hasCommitments hasTemplate onApply={ok()} />);

    expect(screen.getByText(/aqui você lê a semana/i)).toHaveClass("empty-week-touch");
    expect(screen.getByText(/arraste/i)).toHaveClass("empty-week-pointer");
  });
});
