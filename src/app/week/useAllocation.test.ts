import { describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAllocation } from "./useAllocation";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480, createdAt: "" };
const psicologo = { id: 2, name: "Psicólogo", color: "#8250df", dailyMinutes: null, createdAt: "" };

const setup = (allocate = vi.fn().mockResolvedValue({ ok: true, block: null })) =>
  renderHook(() =>
    useAllocation({
      initialBlocks: [],
      commitments: [trabalho, psicologo],
      allocate,
    }),
  );

describe("syncing with the server", () => {
  it("replaces the blocks when the week in focus changes", () => {
    const allocate = vi.fn();
    const first = [{ id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 600 }];
    const second = [{ id: 2, commitmentId: 2, weekday: 3, startMinute: 180, endMinute: 240 }];

    const { result, rerender } = renderHook(
      ({ initialBlocks }) =>
        useAllocation({ initialBlocks, commitments: [trabalho, psicologo], allocate }),
      { initialProps: { initialBlocks: first } },
    );

    expect(result.current.blocks).toEqual(first);

    rerender({ initialBlocks: second });

    expect(result.current.blocks).toEqual(second);
  });

  it("keeps local changes while the server data is unchanged", async () => {
    const allocate = vi.fn().mockResolvedValue({ ok: true, block: null });
    const initialBlocks: never[] = [];

    const { result, rerender } = renderHook(
      () => useAllocation({ initialBlocks, commitments: [trabalho, psicologo], allocate }),
      {},
    );

    await act(async () => {
      await result.current.allocate({ commitmentId: 2, weekday: 1, startMinute: 720 });
    });
    rerender();

    expect(result.current.blocks).toHaveLength(1);
  });
});

describe("allocation state", () => {
  it("adds a block sized by the commitment daily hours", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
    });

    expect(result.current.blocks).toEqual([
      expect.objectContaining({ weekday: 0, startMinute: 120, endMinute: 600, commitmentId: 1 }),
    ]);
  });

  it("adds a one hour block for a commitment without daily minutes", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.allocate({ commitmentId: 2, weekday: 1, startMinute: 720 });
    });

    expect(result.current.blocks[0]).toEqual(
      expect.objectContaining({ startMinute: 720, endMinute: 780 }),
    );
  });

  it("refuses a drop that overlaps and keeps a single block", async () => {
    const allocate = vi.fn().mockResolvedValue({ ok: true, block: null });
    const { result } = setup(allocate);

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
    });
    await act(async () => {
      await result.current.allocate({ commitmentId: 2, weekday: 0, startMinute: 360 });
    });

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.error).toMatch(/ocupado/i);
    expect(allocate).toHaveBeenCalledOnce();
  });

  it("refuses a drop whose duration would pass the end of the day", async () => {
    const allocate = vi.fn();
    const { result } = setup(allocate);

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startMinute: 960 });
    });

    expect(result.current.blocks).toHaveLength(0);
    expect(result.current.error).toMatch(/não cabe/i);
    expect(allocate).not.toHaveBeenCalled();
  });

  it("shows the block optimistically and reports while saving", async () => {
    let resolve: (value: { ok: true; block: null }) => void = () => {};
    const allocate = vi.fn().mockReturnValue(
      new Promise<{ ok: true; block: null }>((r) => {
        resolve = r;
      }),
    );
    const { result } = setup(allocate);

    act(() => {
      void result.current.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
    });

    await waitFor(() => expect(result.current.saving).toBe(true));
    expect(result.current.blocks).toHaveLength(1);

    await act(async () => {
      resolve({ ok: true, block: null });
    });

    await waitFor(() => expect(result.current.saving).toBe(false));
  });

  it("rolls the optimistic block back when the action fails", async () => {
    const allocate = vi.fn().mockResolvedValue({ ok: false, error: "banco fora" });
    const { result } = setup(allocate);

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startMinute: 120 });
    });

    expect(result.current.blocks).toHaveLength(0);
    expect(result.current.error).toBe("banco fora");
  });
});
