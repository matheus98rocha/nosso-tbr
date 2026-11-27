import { describe, expect, it } from "vitest";

import { formatFocusTime } from "./formatFocusTime";

describe("formatFocusTime", () => {
  it("formata minutos e segundos com zero à esquerda", () => {
    expect(formatFocusTime(1500)).toBe("25:00");
    expect(formatFocusTime(65)).toBe("01:05");
  });

  it("mantém minutos acima de 60 sem converter em horas", () => {
    expect(formatFocusTime(10800)).toBe("180:00");
  });

  it("nunca retorna um tempo negativo", () => {
    expect(formatFocusTime(-42)).toBe("00:00");
  });
});
