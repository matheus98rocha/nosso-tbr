import { describe, it, expect } from "vitest";
import { UserSocialMapper } from "../mappers/userSocial.mapper";

describe("UserSocialMapper", () => {
  it("maps row to directory user", () => {
    const out = UserSocialMapper.toDirectoryUser({
      id: "11111111-1111-4111-8111-111111111111",
      display_name: "Test",
      email: "test@example.com",
    });
    expect(out.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(out.displayName).toBe("Test");
    expect(out.email).toBe("test@example.com");
    expect(out.joinedAt).toBeNull();
  });
});
