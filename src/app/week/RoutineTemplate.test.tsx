import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoutineTemplate } from "./RoutineTemplate";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const ok = () => vi.fn().mockResolvedValue({ ok: true });

describe("routine template controls", () => {
  it("saves the focused week as the base routine", async () => {
    const onSave = ok();
    render(<RoutineTemplate onSave={onSave} onApply={ok()} canApply />);

    await userEvent.click(screen.getByRole("button", { name: /salvar como rotina base/i }));

    expect(onSave).toHaveBeenCalledOnce();
  });

  it("confirms that the base routine was saved", async () => {
    render(<RoutineTemplate onSave={ok()} onApply={ok()} canApply />);

    await userEvent.click(screen.getByRole("button", { name: /salvar como rotina base/i }));

    expect(await screen.findByTestId("template-saved")).toBeInTheDocument();
  });

  it("applies the base routine to the focused week", async () => {
    const onApply = ok();
    render(<RoutineTemplate onSave={ok()} onApply={onApply} canApply />);

    await userEvent.click(screen.getByRole("button", { name: /aplicar rotina base/i }));

    expect(onApply).toHaveBeenCalledOnce();
  });

  it("disables applying when the week already has blocks", () => {
    render(<RoutineTemplate onSave={ok()} onApply={ok()} canApply={false} />);

    expect(screen.getByRole("button", { name: /aplicar rotina base/i })).toBeDisabled();
  });

  it("explains why applying is unavailable", () => {
    render(<RoutineTemplate onSave={ok()} onApply={ok()} canApply={false} />);

    expect(screen.getByTestId("template-hint")).toHaveTextContent(/vazia/i);
  });

  it("surfaces a failure returned by the action", async () => {
    const onApply = vi.fn().mockResolvedValue({ ok: false, error: "template vazio" });
    render(<RoutineTemplate onSave={ok()} onApply={onApply} canApply />);

    await userEvent.click(screen.getByRole("button", { name: /aplicar rotina base/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/template vazio/i);
  });
});
