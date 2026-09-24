import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useKeyboardCursor } from "./useKeyboardCursor";

const block = { id: 1, commitmentId: 1, weekday: 2, startHour: 10, endHour: 11 };

describe("keyboard cursor", () => {
  it("starts with nothing grabbed", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    expect(result.current.cursor).toBeNull();
  });

  it("grabs a block at its own position", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab(block));

    expect(result.current.cursor).toEqual({ id: 1, weekday: 2, startHour: 10 });
  });

  it("moves the cursor one hour down", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab(block));
    act(() => result.current.nudge(0, 1));

    expect(result.current.cursor).toEqual({ id: 1, weekday: 2, startHour: 11 });
  });

  it("moves the cursor one weekday right", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab(block));
    act(() => result.current.nudge(1, 0));

    expect(result.current.cursor).toEqual({ id: 1, weekday: 3, startHour: 10 });
  });

  it("stops at the first weekday", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab({ ...block, weekday: 0 }));
    act(() => result.current.nudge(-1, 0));

    expect(result.current.cursor?.weekday).toBe(0);
  });

  it("stops at the last weekday", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab({ ...block, weekday: 6 }));
    act(() => result.current.nudge(1, 0));

    expect(result.current.cursor?.weekday).toBe(6);
  });

  it("stops at the first hour of the day", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab({ ...block, startHour: 6, endHour: 7 }));
    act(() => result.current.nudge(0, -1));

    expect(result.current.cursor?.startHour).toBe(6);
  });

  it("stops before the end of the day", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab({ ...block, startHour: 22, endHour: 23 }));
    act(() => result.current.nudge(0, 1));

    expect(result.current.cursor?.startHour).toBe(22);
  });

  it("releases the cursor", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.grab(block));
    act(() => result.current.release());

    expect(result.current.cursor).toBeNull();
  });

  it("ignores a nudge when nothing is grabbed", () => {
    const { result } = renderHook(() => useKeyboardCursor());

    act(() => result.current.nudge(0, 1));

    expect(result.current.cursor).toBeNull();
  });
});
