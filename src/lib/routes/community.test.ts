import {
  COMMUNITY_PATH,
  getCommunityViewPath,
  getMemberProfilePath,
} from "./community";

describe("community routes", () => {
  it("exporta o path da Comunidade", () => {
    expect(COMMUNITY_PATH).toBe("/community");
  });

  it("monta o path do perfil do membro", () => {
    expect(getMemberProfilePath("abc-123")).toBe("/profile/abc-123");
  });

  it("monta paths de recorte da Comunidade", () => {
    expect(getCommunityViewPath("todos")).toBe("/community");
    expect(getCommunityViewPath("seguindo")).toBe("/community?view=seguindo");
    expect(getCommunityViewPath("seguidores")).toBe(
      "/community?view=seguidores",
    );
  });
});
