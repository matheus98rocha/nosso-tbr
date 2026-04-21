import { describe, expect, it } from "vitest";
import { BookMapper } from "./books.mapper";

describe("BookMapper.isSoloBook", () => {
  it("retorna true quando readers tem 1 elemento igual a chosen_by", () => {
    expect(
      BookMapper.isSoloBook({ readerIds: ["user-a"], chosen_by: "user-a" }),
    ).toBe(true);
  });

  it("retorna false quando readers tem múltiplos elementos", () => {
    expect(
      BookMapper.isSoloBook({
        readerIds: ["user-a", "user-b"],
        chosen_by: "user-a",
      }),
    ).toBe(false);
  });

  it("retorna false quando readers é vazio", () => {
    expect(
      BookMapper.isSoloBook({ readerIds: [], chosen_by: "user-a" }),
    ).toBe(false);
  });

  it("retorna false quando readers tem 1 elemento diferente de chosen_by", () => {
    expect(
      BookMapper.isSoloBook({ readerIds: ["user-a"], chosen_by: "user-b" }),
    ).toBe(false);
  });

  it("retorna false quando chosen_by é string vazia", () => {
    expect(
      BookMapper.isSoloBook({ readerIds: ["user-a"], chosen_by: "" }),
    ).toBe(false);
  });

  it("retorna false quando readers tem 1 elemento mas chosen_by é string vazia", () => {
    expect(
      BookMapper.isSoloBook({ readerIds: [""], chosen_by: "" }),
    ).toBe(true);
  });

  it("diferencia UUIDs com case diferente como distintos (sem normalização)", () => {
    expect(
      BookMapper.isSoloBook({
        readerIds: ["USER-A"],
        chosen_by: "user-a",
      }),
    ).toBe(false);
  });
});
