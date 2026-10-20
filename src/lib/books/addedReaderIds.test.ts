import { describe, expect, it } from "vitest";

import { addedReaderIds } from "./addedReaderIds";

describe("addedReaderIds", () => {
  it("ignores the actor and readers already on the book", () => {
    expect(
      addedReaderIds(["alice", "carol"], ["alice", "carol", "alice"], "alice"),
    ).toEqual([]);
  });

  it("returns each newly added reader once", () => {
    expect(
      addedReaderIds(["alice"], ["alice", "bob", " bob ", "bob"], "alice"),
    ).toEqual(["bob"]);
  });

  it("treats a missing current list as empty", () => {
    expect(addedReaderIds(null, ["alice", "bob"], "alice")).toEqual(["bob"]);
  });
});
