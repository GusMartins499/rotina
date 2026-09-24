import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSavingToast } from "./useSavingToast";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("saving toast", () => {
  it("shows nothing before any change", () => {
    const { result } = renderHook(() => useSavingToast(false, null));

    expect(result.current).toBeNull();
  });

  it("reports that a change is being saved", () => {
    const { result } = renderHook(({ saving }) => useSavingToast(saving, null), {
      initialProps: { saving: true },
    });

    expect(result.current).toEqual({ state: "saving", message: "Salvando…" });
  });

  it("confirms the change once it lands", () => {
    const { result, rerender } = renderHook(({ saving }) => useSavingToast(saving, null), {
      initialProps: { saving: true },
    });

    rerender({ saving: false });

    expect(result.current).toEqual({ state: "saved", message: "Salvo" });
  });

  it("keeps the confirmation readable for a minimum duration", () => {
    const { result, rerender } = renderHook(({ saving }) => useSavingToast(saving, null), {
      initialProps: { saving: true },
    });

    rerender({ saving: false });
    act(() => void vi.advanceTimersByTime(400));

    expect(result.current?.state).toBe("saved");
  });

  it("clears the confirmation after the minimum duration", () => {
    const { result, rerender } = renderHook(({ saving }) => useSavingToast(saving, null), {
      initialProps: { saving: true },
    });

    rerender({ saving: false });
    act(() => void vi.advanceTimersByTime(2000));

    expect(result.current).toBeNull();
  });

  it("reports a failure distinctly from a success", () => {
    const { result } = renderHook(() => useSavingToast(false, "banco fora"));

    expect(result.current).toEqual({ state: "failed", message: "banco fora" });
  });

  it("keeps a failure on screen without expiring it", () => {
    const { result } = renderHook(() => useSavingToast(false, "banco fora"));

    act(() => void vi.advanceTimersByTime(10_000));

    expect(result.current?.state).toBe("failed");
  });
});
