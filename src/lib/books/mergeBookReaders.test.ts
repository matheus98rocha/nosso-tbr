import { describe, expect, it } from "vitest";

import { mergeBookReaders } from "./mergeBookReaders";

describe("mergeBookReaders", () => {
  it("keeps a reader invited after the client loaded the book", () => {
    expect(mergeBookReaders(["alice", "carol"], ["alice"], ["alice"])).toEqual([
      "alice",
      "carol",
    ]);
  });

  it("removes a reader the client explicitly dropped from its snapshot", () => {
    expect(
      mergeBookReaders(
        ["alice", "bob", "carol"],
        ["alice"],
        ["alice", "bob"],
      ),
    ).toEqual(["alice", "carol"]);
  });

  it("appends a reader the client added on top of its snapshot", () => {
    expect(
      mergeBookReaders(["alice", "carol"], ["alice", "bob"], ["alice"]),
    ).toEqual(["alice", "carol", "bob"]);
  });

  it("replaces the list when the client has no snapshot", () => {
    expect(mergeBookReaders(["alice", "carol"], ["alice"], undefined)).toEqual([
      "alice",
    ]);
  });

  it("does not restore a reader removed by a newer save", () => {
    expect(mergeBookReaders(["alice"], ["alice", "bob"], ["alice", "bob"])).toEqual([
      "alice",
    ]);
  });
});
