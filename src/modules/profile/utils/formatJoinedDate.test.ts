import { describe, expect, it } from "vitest";
import { formatJoinedDate } from "./formatJoinedDate";

describe("formatJoinedDate", () => {
  it("retorna em dash quando iso é nulo", () => {
    expect(formatJoinedDate(null)).toBe("—");
  });

  it("formata data ISO válida em pt-BR", () => {
    expect(formatJoinedDate("2024-03-15T12:00:00.000Z")).toMatch(/2024/);
  });
});
