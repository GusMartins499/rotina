import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeekSwitcher } from "./WeekSwitcher";

const SUNDAY = "2026-09-27";
const WEDNESDAY = "2026-09-23";

describe("week switcher", () => {
  it("enables configuring the next week on a sunday", () => {
    render(<WeekSwitcher focus="current" today={SUNDAY} />);

    expect(screen.getByRole("link", { name: /próxima semana/i })).toHaveAttribute(
      "href",
      "/?week=next",
    );
  });

  it("disables configuring the next week from monday to saturday", () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    expect(screen.queryByRole("link", { name: /próxima semana/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("configure-next")).toBeDisabled();
  });

  it("explains that the next week is configured on sunday", () => {
    render(<WeekSwitcher focus="current" today={WEDNESDAY} />);

    expect(screen.getByTestId("configure-hint")).toHaveTextContent(/domingo/i);
  });

  it("gives no hint when configuring is available", () => {
    render(<WeekSwitcher focus="current" today={SUNDAY} />);

    expect(screen.queryByTestId("configure-hint")).not.toBeInTheDocument();
  });

  it("always allows returning to the current week", () => {
    render(<WeekSwitcher focus="next" today={WEDNESDAY} />);

    expect(screen.getByRole("link", { name: /voltar/i })).toHaveAttribute("href", "/");
  });

  it("announces which week is in focus", () => {
    render(<WeekSwitcher focus="next" today={SUNDAY} />);

    expect(screen.getByTestId("week-focus")).toHaveTextContent(/próxima semana/i);
  });
})
