import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FINE_HOVER_QUERY,
  HOVER_CLOSE_GRACE_MS,
  HOVER_OPEN_DELAY_MS,
  WeeklyLoadButton,
} from "./WeeklyLoadButton";

function pointerIs(kind: "fine" | "coarse") {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === FINE_HOVER_QUERY && kind === "fine",
  })) as unknown as typeof window.matchMedia;
}

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

const renderButton = () =>
  render(
    <div>
      <WeeklyLoadButton
        commitments={[{ id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" }]}
        blocks={[]}
      />
      <button type="button">Configurações</button>
    </div>,
  );

const toggle = () => screen.getByTestId("weekly-load-toggle");
const panel = () => screen.queryByTestId("weekly-load-1");
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("weekly load on hover", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    pointerIs("fine");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the panel when the pointer enters the button", async () => {
    renderButton();

    await user().hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);

    expect(panel()).toBeInTheDocument();
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the panel when the pointer leaves", async () => {
    renderButton();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.unhover(toggle());
    await wait(HOVER_CLOSE_GRACE_MS);

    expect(panel()).toBeNull();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the panel open while the pointer travels from button to panel", async () => {
    renderButton();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.unhover(toggle());
    await wait(HOVER_CLOSE_GRACE_MS / 2);
    await pointer.hover(panel()!);
    await wait(HOVER_CLOSE_GRACE_MS);

    expect(panel()).toBeInTheDocument();
  });

  it("does not open on a quick pass over the button", async () => {
    renderButton();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS / 2);
    await pointer.unhover(toggle());
    await wait(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_GRACE_MS);

    expect(panel()).toBeNull();
  });

  it("pins the panel on click", async () => {
    renderButton();
    const pointer = user();

    await pointer.click(toggle());
    await pointer.unhover(toggle());
    await wait(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_GRACE_MS);

    expect(panel()).toBeInTheDocument();
  });

  it("unpins on a second click", async () => {
    renderButton();
    const pointer = user();

    await pointer.click(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.click(toggle());

    expect(panel()).toBeNull();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on keyboard focus", async () => {
    renderButton();
    const keyboard = user();

    await keyboard.tab();

    expect(toggle()).toHaveFocus();
    expect(panel()).toBeInTheDocument();

    await keyboard.tab();

    expect(panel()).toBeNull();
  });

  it("still closes with Escape and with a click outside", async () => {
    renderButton();
    const pointer = user();

    await pointer.click(toggle());
    await pointer.keyboard("{Escape}");

    expect(panel()).toBeNull();

    await pointer.click(toggle());
    await pointer.click(document.body);

    expect(panel()).toBeNull();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("does not open on hover on a coarse pointer", async () => {
    pointerIs("coarse");
    renderButton();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);

    expect(panel()).toBeNull();

    await pointer.click(toggle());

    expect(panel()).toBeInTheDocument();
  });
});
