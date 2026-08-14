import { describe, expect, it } from "vitest";
import {
  canUserParticipateInBook,
  isCollectiveReadingBook,
} from "./bookParticipation";

const uid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("canUserParticipateInBook (RN42)", () => {
  it("retorna true quando user_id confere", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: uid,
        chosen_by: other,
        readers: [other],
      }),
    ).toBe(true);
  });

  it("retorna true quando chosen_by confere", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: null,
        chosen_by: uid,
        readers: [other],
      }),
    ).toBe(true);
  });

  it("retorna true quando o usuário está em readers", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: [uid],
      }),
    ).toBe(true);
  });

  it("retorna false para usuário sem vínculo ao livro", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: [other],
      }),
    ).toBe(false);
  });

  it("ignora user_id só com espaços e avalia demais campos", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: "  \t  ",
        chosen_by: other,
        readers: [uid],
      }),
    ).toBe(true);
    expect(
      canUserParticipateInBook(uid, {
        user_id: "  ",
        chosen_by: other,
        readers: [],
      }),
    ).toBe(false);
  });

  it("trata readers ausente como lista vazia", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: undefined,
      }),
    ).toBe(false);
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: null,
      }),
    ).toBe(false);
  });

  it("ignora chosen_by vazio e usa readers", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: "",
        readers: [uid],
      }),
    ).toBe(true);
  });
});

describe("isCollectiveReadingBook (RN59)", () => {
  it("retorna true com mais de um reader", () => {
    expect(isCollectiveReadingBook(["a", "b"])).toBe(true);
  });

  it("retorna false com zero ou um reader", () => {
    expect(isCollectiveReadingBook([])).toBe(false);
    expect(isCollectiveReadingBook(["a"])).toBe(false);
    expect(isCollectiveReadingBook(undefined)).toBe(false);
    expect(isCollectiveReadingBook(null)).toBe(false);
  });
});
