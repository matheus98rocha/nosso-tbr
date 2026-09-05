import { describe, expect, it } from "vitest";

import { buildNetworkUserIds } from "./buildNetworkUserIds";

describe("buildNetworkUserIds", () => {
  it("inclui o usuário atual e os seguidos sem duplicar", () => {
    expect(buildNetworkUserIds("me", ["a", "b", "me"])).toEqual([
      "me",
      "a",
      "b",
    ]);
  });

  it("retorna só o usuário atual quando não há follows", () => {
    expect(buildNetworkUserIds("me", [])).toEqual(["me"]);
  });

  it("ignora ids vazios nos seguidos", () => {
    expect(buildNetworkUserIds("me", ["", "a"])).toEqual(["me", "a"]);
  });
});
