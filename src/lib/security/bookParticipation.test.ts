import { describe, expect, it } from "vitest";
import { canUserParticipateInBook } from "./bookParticipation";

const uid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("canUserParticipateInBook", () => {
  it("returns true when user_id matches", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: uid,
        chosen_by: other,
        readers: [other],
      }),
    ).toBe(true);
  });

  it("returns true when chosen_by matches", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: null,
        chosen_by: uid,
        readers: [other],
      }),
    ).toBe(true);
  });

  it("returns true when user is in readers", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: [uid],
      }),
    ).toBe(true);
  });

  it("returns false for unrelated user", () => {
    expect(
      canUserParticipateInBook(uid, {
        user_id: other,
        chosen_by: other,
        readers: [other],
      }),
    ).toBe(false);
  });
});
