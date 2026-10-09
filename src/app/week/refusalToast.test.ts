import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAllocation } from "./useAllocation";
import { CONFIRMATION_MS, REFUSAL_MS, useSavingToast } from "./useSavingToast";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" };
const psicologo = { id: 2, name: "Psicólogo", color: "#8250df", dailyMinutes: null, createdAt: "" };

const occupied = { commitmentId: 2, weekday: 0, startMinute: 360 };
const free = { commitmentId: 2, weekday: 1, startMinute: 360 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function setupWithAllocatedMorning(
  allocate = vi.fn().mockResolvedValue({ ok: true, block: null }),
) {
  const hook = renderHook(() => {
    const week = useAllocation({
      initialBlocks: [],
      commitments: [trabalho, psicologo],
      allocate,
    });
    return { week, toast: useSavingToast(week.saving, week.error, week.failures) };
  });

  await act(async () => {
    await hook.result.current.week.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
  });
  act(() => void vi.advanceTimersByTime(CONFIRMATION_MS));

  return hook;
}

async function dropOnto(
  result: Awaited<ReturnType<typeof setupWithAllocatedMorning>>["result"],
  target: typeof occupied,
) {
  await act(async () => {
    await result.current.week.allocate(target);
  });
}

describe("refusal toast", () => {
  it("shows the refusal message when a drop is refused", async () => {
    const { result } = await setupWithAllocatedMorning();

    await dropOnto(result, occupied);

    expect(result.current.toast).toEqual({
      state: "failed",
      message: "Esse horário já está ocupado.",
    });
  });

  it("dismisses the refusal on its own", async () => {
    const { result } = await setupWithAllocatedMorning();

    await dropOnto(result, occupied);
    act(() => void vi.advanceTimersByTime(REFUSAL_MS));

    expect(result.current.toast).toBeNull();
  });

  it("keeps the refusal long enough to be read", () => {
    expect(REFUSAL_MS).toBeGreaterThan(CONFIRMATION_MS);
  });

  it("replaces a pending refusal with a newer one", async () => {
    const { result } = await setupWithAllocatedMorning();

    await dropOnto(result, occupied);
    act(() => void vi.advanceTimersByTime(REFUSAL_MS - 1000));
    await dropOnto(result, { commitmentId: 1, weekday: 0, startMinute: 960 });
    act(() => void vi.advanceTimersByTime(REFUSAL_MS - 1));

    expect(result.current.toast).toEqual({
      state: "failed",
      message: "O compromisso não cabe nesse horário.",
    });

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current.toast).toBeNull();
  });

  it("restarts the duration when the same refusal happens twice in a row", async () => {
    const { result } = await setupWithAllocatedMorning();

    await dropOnto(result, occupied);
    act(() => void vi.advanceTimersByTime(REFUSAL_MS - 1000));
    await dropOnto(result, occupied);
    act(() => void vi.advanceTimersByTime(REFUSAL_MS - 1));

    expect(result.current.toast?.state).toBe("failed");
  });

  it("dismisses the refusal as soon as the next action succeeds", async () => {
    let land: (value: { ok: true; block: null }) => void = () => {};
    const allocate = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, block: null })
      .mockReturnValueOnce(
        new Promise<{ ok: true; block: null }>((resolve) => {
          land = resolve;
        }),
      );
    const { result } = await setupWithAllocatedMorning(allocate);

    await dropOnto(result, occupied);
    act(() => {
      void result.current.week.allocate(free);
    });

    expect(result.current.toast).toEqual({ state: "saving", message: "Salvando…" });

    await act(async () => {
      land({ ok: true, block: null });
    });

    expect(result.current.toast).toEqual({ state: "saved", message: "Salvo" });
  });

  it("dismisses a failed write on its own", async () => {
    const allocate = vi.fn().mockResolvedValue({ ok: false, error: "banco fora" });
    const { result } = renderHook(() => {
      const week = useAllocation({ initialBlocks: [], commitments: [trabalho], allocate });
      return { week, toast: useSavingToast(week.saving, week.error, week.failures) };
    });

    await act(async () => {
      await result.current.week.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
    });

    expect(result.current.toast).toEqual({ state: "failed", message: "banco fora" });

    act(() => void vi.advanceTimersByTime(REFUSAL_MS));

    expect(result.current.toast).toBeNull();
  });

  it("still announces the refusal to assistive technology", async () => {
    const { result } = await setupWithAllocatedMorning();

    await dropOnto(result, occupied);
    act(() => void vi.advanceTimersByTime(REFUSAL_MS));

    expect(result.current.week.announcement).toBe("Esse horário já está ocupado.");
  });
});
