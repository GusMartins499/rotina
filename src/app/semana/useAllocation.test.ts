import { describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAllocation } from "./useAllocation";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyHours: 8, createdAt: "" };
const psicologo = { id: 2, name: "Psicólogo", color: "#8250df", dailyHours: null, createdAt: "" };

const setup = (allocate = vi.fn().mockResolvedValue({ ok: true, block: null })) =>
  renderHook(() =>
    useAllocation({
      initialBlocks: [],
      commitments: [trabalho, psicologo],
      allocate,
    }),
  );

describe("allocation state", () => {
  it("adds a block sized by the commitment daily hours", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startHour: 8 });
    });

    expect(result.current.blocks).toEqual([
      expect.objectContaining({ weekday: 0, startHour: 8, endHour: 16, commitmentId: 1 }),
    ]);
  });

  it("adds a one hour block for a commitment without daily hours", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.allocate({ commitmentId: 2, weekday: 1, startHour: 18 });
    });

    expect(result.current.blocks[0]).toEqual(
      expect.objectContaining({ startHour: 18, endHour: 19 }),
    );
  });

  it("refuses a drop that overlaps and keeps a single block", async () => {
    const allocate = vi.fn().mockResolvedValue({ ok: true, block: null });
    const { result } = setup(allocate);

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startHour: 8 });
    });
    await act(async () => {
      await result.current.allocate({ commitmentId: 2, weekday: 0, startHour: 12 });
    });

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.error).toMatch(/ocupado/i);
    expect(allocate).toHaveBeenCalledOnce();
  });

  it("refuses a drop whose duration would pass the end of the day", async () => {
    const allocate = vi.fn();
    const { result } = setup(allocate);

    await act(async () => {
      await result.current.allocate({ commitmentId: 1, weekday: 0, startHour: 22 });
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
      void result.current.allocate({ commitmentId: 1, weekday: 0, startHour: 8 });
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
      await result.current.allocate({ commitmentId: 1, weekday: 0, startHour: 8 });
    });

    expect(result.current.blocks).toHaveLength(0);
    expect(result.current.error).toBe("banco fora");
  });
});
