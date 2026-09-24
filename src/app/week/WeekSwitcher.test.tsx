import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeekSwitcher } from "./WeekSwitcher";

describe("week switcher", () => {
  it("offers to configure the next week while the current one is in focus", () => {
    render(<WeekSwitcher focus="current" />);

    expect(screen.getByRole("link", { name: /próxima semana/i })).toHaveAttribute(
      "href",
      "/?week=next",
    );
  });

  it("offers to go back while the next week is in focus", () => {
    render(<WeekSwitcher focus="next" />);

    expect(screen.getByRole("link", { name: /voltar/i })).toHaveAttribute("href", "/");
  });

  it("announces which week is in focus", () => {
    render(<WeekSwitcher focus="next" />);

    expect(screen.getByTestId("week-focus")).toHaveTextContent(/próxima semana/i);
  });
});
