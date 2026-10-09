import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekSwitcher } from "./WeekSwitcher";

const SUNDAY = "2026-09-27";
const MONDAY = "2026-09-21";
const WEDNESDAY = "2026-09-23";

function optionLabels() {
  return [...screen.getByRole("group").children]
    .filter((child) => child.classList.contains("week-option"))
    .map((option) => option.textContent);
}

describe("week switcher", () => {
  it("renders both weeks as a two option control", () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    const group = screen.getByRole("group", { name: /semana em foco/i });
    expect(group).toHaveTextContent("Atual");
    expect(group).toHaveTextContent("Próxima");
  });

  it("marks the focused week as selected", () => {
    render(<WeekSwitcher focus="next" today={SUNDAY} />);

    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Atual" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("week-focus")).toHaveTextContent("Próxima");
  });

  it("navigates to the next week on sunday", () => {
    render(<WeekSwitcher focus="current" today={SUNDAY} />);

    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/?week=next");
    expect(screen.queryByTestId("configure-hint")).not.toBeInTheDocument();
  });

  it("disables the next week outside sunday", async () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    const next = screen.getByRole("button", { name: "Próxima" });
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
    expect(next).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(next);
    expect(screen.getByTestId("week-focus")).toHaveTextContent("Atual");
  });

  it("links the explanation to the disabled option", () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    expect(screen.getByRole("button", { name: "Próxima" })).toHaveAccessibleDescription(
      "A próxima semana é configurada no domingo.",
    );
  });

  it("keeps the explanation reachable by keyboard", async () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    await userEvent.tab();
    await userEvent.tab();

    expect(screen.getByRole("button", { name: "Próxima" })).toHaveFocus();
  });

  it("returns to the current week from the next one", () => {
    render(<WeekSwitcher focus="next" today={WEDNESDAY} />);

    expect(screen.getByRole("link", { name: "Atual" })).toHaveAttribute("href", "/");
  });

  it("keeps the control the same size whatever the day", () => {
    const { unmount } = render(<WeekSwitcher focus="current" today={SUNDAY} />);
    const onSunday = optionLabels();
    unmount();

    render(<WeekSwitcher focus="current" today={MONDAY} />);

    expect(onSunday).toEqual(["Atual", "Próxima"]);
    expect(optionLabels()).toEqual(onSunday);
  });
});
