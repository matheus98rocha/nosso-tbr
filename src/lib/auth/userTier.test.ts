import { describe, expect, it } from "vitest";

import { isAdminTier, USER_TIERS } from "./userTier";

describe("isAdminTier", () => {
  it("retorna true só para admin", () => {
    expect(isAdminTier(USER_TIERS.admin)).toBe(true);
    expect(isAdminTier(USER_TIERS.commonUser)).toBe(false);
    expect(isAdminTier(null)).toBe(false);
    expect(isAdminTier(undefined)).toBe(false);
  });
});
