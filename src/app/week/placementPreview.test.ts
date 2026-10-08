import { describe, it, expect } from "vitest";
import { dropPreviewOf } from "./placementPreview";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

const trabalho: Commitment = {
  id: 1,
  name: "TRABALHO",
  color: "#d73a4a",
  dailyMinutes: 480,
  createdAt: "",
};

const psicologo: Commitment = {
  id: 2,
  name: "Psicologo",
  color: "#8250df",
  dailyMinutes: null,
  createdAt: "",
};

describe("drop preview", () => {
  it("previews the whole span of a commitment dragged from the drawer", () => {
    const preview = dropPreviewOf(
      { kind: "commitment", commitment: trabalho },
      { weekday: 0, startMinute: 0 },
      [],
    );

    expect(preview).toEqual({ weekday: 0, startMinute: 0, endMinute: 480, refused: false });
  });

  it("previews a 30 minute span for a commitment without daily load", () => {
    const preview = dropPreviewOf(
      { kind: "commitment", commitment: psicologo },
      { weekday: 2, startMinute: 120 },
      [],
    );

    expect(preview).toEqual({ weekday: 2, startMinute: 120, endMinute: 150, refused: false });
  });

  it("marks the preview as refused when the span overlaps another block", () => {
    const existing: PlacedBlock[] = [
      { id: 7, commitmentId: 2, weekday: 0, startMinute: 240, endMinute: 360 },
    ];

    const preview = dropPreviewOf(
      { kind: "commitment", commitment: trabalho },
      { weekday: 0, startMinute: 0 },
      existing,
    );

    expect(preview?.refused).toBe(true);
  });

  it("marks the preview as refused when the span does not fit the day", () => {
    const preview = dropPreviewOf(
      { kind: "commitment", commitment: trabalho },
      { weekday: 0, startMinute: 960 },
      [],
    );

    expect(preview).toEqual({ weekday: 0, startMinute: 960, endMinute: 1440, refused: true });
  });

  it("previews the span of a block being moved", () => {
    const block: PlacedBlock = { id: 1, commitmentId: 1, weekday: 0, startMinute: 180, endMinute: 420 };

    const preview = dropPreviewOf(
      { kind: "block", block, commitment: trabalho },
      { weekday: 3, startMinute: 540 },
      [block],
    );

    expect(preview).toEqual({ weekday: 3, startMinute: 540, endMinute: 780, refused: false });
  });

  it("does not mark the moved block's own slots as refused", () => {
    const block: PlacedBlock = { id: 1, commitmentId: 1, weekday: 0, startMinute: 180, endMinute: 420 };

    const preview = dropPreviewOf(
      { kind: "block", block, commitment: trabalho },
      { weekday: 0, startMinute: 210 },
      [block],
    );

    expect(preview).toEqual({ weekday: 0, startMinute: 210, endMinute: 450, refused: false });
  });

  it("previews nothing for a commitment that is no longer known", () => {
    const preview = dropPreviewOf(
      { kind: "commitment", commitment: undefined },
      { weekday: 0, startMinute: 0 },
      [],
    );

    expect(preview).toBeNull();
  });
});
