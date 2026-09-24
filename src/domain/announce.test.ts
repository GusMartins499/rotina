import { describe, it, expect } from "vitest";
import { announceMove, announceRefusal, announceRemoval, announceResize } from "./announce";

describe("announcements", () => {
  it("names the commitment, weekday and hours after a move", () => {
    expect(
      announceMove("TRABALHO", { weekday: 1, startHour: 9, endHour: 17 }),
    ).toBe("TRABALHO movido para terça, 09:00 às 17:00.");
  });

  it("names the new interval after a resize", () => {
    expect(
      announceResize("TRABALHO", { weekday: 0, startHour: 8, endHour: 13 }),
    ).toBe("TRABALHO redimensionado para segunda, 08:00 às 13:00.");
  });

  it("names what was removed", () => {
    expect(
      announceRemoval("FLASHCARDS", { weekday: 4, startHour: 7, endHour: 8 }),
    ).toBe("FLASHCARDS removido de sexta, 07:00 às 08:00.");
  });

  it("explains a refusal caused by an occupied slot", () => {
    expect(announceRefusal("overlap")).toBe("Esse horário já está ocupado.");
  });

  it("explains a refusal caused by the end of the day", () => {
    expect(announceRefusal("out-of-day")).toBe("O compromisso não cabe nesse horário.");
  });

  it("explains a refusal caused by an empty duration", () => {
    expect(announceRefusal("empty")).toBe("Um bloco precisa ter pelo menos uma hora.");
  });
});
