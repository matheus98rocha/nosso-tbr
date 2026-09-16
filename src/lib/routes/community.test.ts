import { COMMUNITY_PATH, getMemberProfilePath } from "./community";

describe("community routes", () => {
  it("exporta o path da Comunidade", () => {
    expect(COMMUNITY_PATH).toBe("/community");
  });

  it("monta o path do perfil do membro", () => {
    expect(getMemberProfilePath("abc-123")).toBe("/profile/abc-123");
  });
});
