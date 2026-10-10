import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekBoard } from "./WeekBoard";
import {
  FINE_HOVER_QUERY,
  HOVER_CLOSE_GRACE_MS,
  HOVER_OPEN_DELAY_MS,
} from "./useHoverDisclosure";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function pointerIs(kind: "fine" | "coarse") {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === FINE_HOVER_QUERY && kind === "fine",
  })) as unknown as typeof window.matchMedia;
}

const ok = () => vi.fn().mockResolvedValue({ ok: true });

const renderBoard = () =>
  render(
    <WeekBoard
      weekLabel="Semana do dia 05/10 até 11/10 de 2026"
      focusedMonday="2026-10-05"
      focus="current"
      today="2026-10-10"
      commitments={[
        { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" },
      ]}
      allocatedBlocks={{}}
      initialBlocks={[]}
      allocate={ok()}
      move={ok()}
      resize={ok()}
      remove={ok()}
      saveTemplate={ok()}
      applyTemplate={ok()}
      hasTemplate
    />,
  );

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const toggle = () => screen.getByTestId("commitments-toggle");
const drawer = () => screen.getByRole("complementary", { name: "Compromissos", hidden: true });
const item = () => screen.getByTestId("drawer-commitment-1");
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const DND_KIT_CLICK_GUARD_MS = 50;

function expectOpen(open: boolean) {
  expect(drawer()).toHaveAttribute("data-open", open ? "true" : "false");
  expect(toggle()).toHaveAttribute("aria-expanded", open ? "true" : "false");
}

describe("commitment drawer on hover", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    pointerIs("fine");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the drawer when the pointer enters the button", async () => {
    renderBoard();

    await user().hover(toggle());

    expectOpen(false);

    await wait(HOVER_OPEN_DELAY_MS);

    expectOpen(true);
  });

  it("does not open on a quick pass over the button", async () => {
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS / 2);
    await pointer.unhover(toggle());
    await wait(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_GRACE_MS);

    expectOpen(false);
  });

  it("stays open while the pointer travels from the button into the drawer", async () => {
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.unhover(toggle());
    await wait(HOVER_CLOSE_GRACE_MS / 2);
    await pointer.hover(drawer());
    await wait(HOVER_CLOSE_GRACE_MS);

    expectOpen(true);
  });

  it("closes when the pointer leaves both button and drawer", async () => {
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.hover(drawer());
    await pointer.unhover(drawer());
    await wait(HOVER_CLOSE_GRACE_MS / 2);

    expectOpen(true);

    await wait(HOVER_CLOSE_GRACE_MS);

    expectOpen(false);
  });

  it("cancels a pending close when the pointer comes back to the button", async () => {
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.unhover(toggle());
    await wait(HOVER_CLOSE_GRACE_MS / 2);
    await pointer.hover(toggle());
    await wait(HOVER_CLOSE_GRACE_MS + HOVER_OPEN_DELAY_MS);

    expectOpen(true);
  });

  it("does not close while a commitment is being dragged out of the drawer", async () => {
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);
    await pointer.hover(drawer());

    fireEvent.pointerDown(item(), { clientX: 10, clientY: 10, button: 0, isPrimary: true });
    fireEvent.pointerMove(document, { clientX: 400, clientY: 300 });

    expect(drawer()).toHaveAttribute("data-dragging", "true");

    fireEvent.pointerLeave(drawer());
    await wait(HOVER_CLOSE_GRACE_MS * 2);

    expect(drawer()).toHaveAttribute("data-dragging", "true");
    expectOpen(true);

    fireEvent.pointerUp(document, { clientX: 400, clientY: 300 });

    expect(drawer()).not.toHaveAttribute("data-dragging");
    expectOpen(false);
    await wait(DND_KIT_CLICK_GUARD_MS);
  });

  it("pins the drawer on click and unpins on a second click", async () => {
    renderBoard();
    const pointer = user();

    await pointer.click(toggle());
    await pointer.unhover(toggle());
    await wait(HOVER_OPEN_DELAY_MS + HOVER_CLOSE_GRACE_MS);

    expectOpen(true);

    await pointer.click(toggle());

    expectOpen(false);
  });

  it("opens on keyboard focus and stays open while focus moves into the drawer", async () => {
    renderBoard();

    act(() => toggle().focus());

    expectOpen(true);

    act(() => item().focus());

    expectOpen(true);

    act(() => toggle().focus());
    act(() => toggle().blur());

    expectOpen(false);
  });

  it("still closes with Escape and with a click outside", async () => {
    renderBoard();
    const pointer = user();

    await pointer.click(toggle());
    await pointer.keyboard("{Escape}");

    expectOpen(false);

    await pointer.click(toggle());
    await pointer.click(screen.getByRole("heading", { level: 1 }));

    expectOpen(false);
  });

  it("does not open on hover on a coarse pointer", async () => {
    pointerIs("coarse");
    renderBoard();
    const pointer = user();

    await pointer.hover(toggle());
    await wait(HOVER_OPEN_DELAY_MS);

    expectOpen(false);

    await pointer.click(toggle());

    expectOpen(true);
  });
});
