import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAllocation } from "./useAllocation";

const trabalho = { id: 1, name: "TRABALHO", color: "#d73a4a", dailyHours: 8, createdAt: "" };
const flashcards = { id: 2, name: "FLASHCARDS", color: "#0969da", dailyHours: 1, createdAt: "" };

const monday8to13 = { id: 10, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 };
const monday14to17 = { id: 11, commitmentId: 1, weekday: 0, startHour: 14, endHour: 17 };

const setup = (initialBlocks = [monday8to13], persist = defaultPersist()) =>
  renderHook(() =>
    useAllocation({
      initialBlocks,
      commitments: [trabalho, flashcards],
      allocate: persist.allocate,
      move: persist.move,
      resize: persist.resize,
      remove: persist.remove,
    }),
  );

function defaultPersist() {
  return {
    allocate: vi.fn().mockResolvedValue({ ok: true, block: null }),
    move: vi.fn().mockResolvedValue({ ok: true }),
    resize: vi.fn().mockResolvedValue({ ok: true }),
    remove: vi.fn().mockResolvedValue({ ok: true }),
  };
}

describe("moving a block", () => {
  it("moves a block preserving its duration", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.move(monday8to13, { weekday: 1, startHour: 9 });
    });

    expect(result.current.blocks[0]).toEqual(
      expect.objectContaining({ weekday: 1, startHour: 9, endHour: 14 }),
    );
  });

  it("refuses a move onto an occupied slot and keeps the block where it was", async () => {
    const persist = defaultPersist();
    const { result } = setup([monday8to13, monday14to17], persist);

    await act(async () => {
      await result.current.move(monday8to13, { weekday: 0, startHour: 12 });
    });

    expect(result.current.blocks[0]).toEqual(expect.objectContaining({ startHour: 8 }));
    expect(result.current.error).toMatch(/ocupado/i);
    expect(persist.move).not.toHaveBeenCalled();
  });

  it("rolls the move back when persistence fails", async () => {
    const persist = defaultPersist();
    persist.move = vi.fn().mockResolvedValue({ ok: false, error: "banco fora" });
    const { result } = setup([monday8to13], persist);

    await act(async () => {
      await result.current.move(monday8to13, { weekday: 1, startHour: 9 });
    });

    expect(result.current.blocks[0]).toEqual(expect.objectContaining({ weekday: 0, startHour: 8 }));
    expect(result.current.error).toBe("banco fora");
  });
});

describe("resizing a block", () => {
  it("shortens a block to the requested end hour", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.resize(monday8to13, 13 - 2);
    });

    expect(result.current.blocks[0]).toEqual(expect.objectContaining({ endHour: 11 }));
  });

  it("refuses a resize that would overlap the next block", async () => {
    const persist = defaultPersist();
    const { result } = setup([monday8to13, monday14to17], persist);

    await act(async () => {
      await result.current.resize(monday8to13, 15);
    });

    expect(result.current.blocks[0]).toEqual(expect.objectContaining({ endHour: 13 }));
    expect(persist.resize).not.toHaveBeenCalled();
  });

  it("refuses a resize down to zero duration", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.resize(monday8to13, 8);
    });

    expect(result.current.blocks[0]).toEqual(expect.objectContaining({ endHour: 13 }));
    expect(result.current.error).toMatch(/uma hora/i);
  });
});

describe("announcements", () => {
  it("announces a move naming the commitment and the new hours", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.move(monday8to13, { weekday: 1, startHour: 9 });
    });

    expect(result.current.announcement).toBe("TRABALHO movido para terça, 09:00 às 14:00.");
  });

  it("announces a resize", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.resize(monday8to13, 11);
    });

    expect(result.current.announcement).toBe(
      "TRABALHO redimensionado para segunda, 08:00 às 11:00.",
    );
  });

  it("announces a removal naming what was removed", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.remove(monday8to13);
    });

    expect(result.current.announcement).toBe("TRABALHO removido de segunda, 08:00 às 13:00.");
  });

  it("announces a refusal, not only a success", async () => {
    const { result } = setup([monday8to13, monday14to17]);

    await act(async () => {
      await result.current.move(monday8to13, { weekday: 0, startHour: 12 });
    });

    expect(result.current.announcement).toBe("Esse horário já está ocupado.");
  });
});

describe("removing a block", () => {
  it("removes the block and frees the slot", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.remove(monday8to13);
    });

    expect(result.current.blocks).toHaveLength(0);
  });

  it("puts the block back when removal fails", async () => {
    const persist = defaultPersist();
    persist.remove = vi.fn().mockResolvedValue({ ok: false, error: "banco fora" });
    const { result } = setup([monday8to13], persist);

    await act(async () => {
      await result.current.remove(monday8to13);
    });

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.error).toBe("banco fora");
  });
});
