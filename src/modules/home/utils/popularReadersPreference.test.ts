import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPopularReadersHideStorageKey,
  readPopularReadersHidden,
  writePopularReadersHidden,
} from "./popularReadersPreference";

describe("popularReadersPreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("builds a storage key scoped by user id", () => {
    expect(getPopularReadersHideStorageKey("user-1")).toBe(
      "nosso-tbr:home:hide-popular-readers:user-1",
    );
  });

  it("reads hidden as false when key is absent", () => {
    expect(readPopularReadersHidden("user-1")).toBe(false);
  });

  it("persists and clears hidden preference per user", () => {
    writePopularReadersHidden("user-a", true);
    writePopularReadersHidden("user-b", true);

    expect(readPopularReadersHidden("user-a")).toBe(true);
    expect(readPopularReadersHidden("user-b")).toBe(true);

    writePopularReadersHidden("user-a", false);

    expect(readPopularReadersHidden("user-a")).toBe(false);
    expect(readPopularReadersHidden("user-b")).toBe(true);
  });

  it("returns false when localStorage throws on read", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(readPopularReadersHidden("user-1")).toBe(false);
    getItem.mockRestore();
  });
});
