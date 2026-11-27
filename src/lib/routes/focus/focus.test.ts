import { FOCUS_PATH } from "./focus";

describe("focus routes", () => {
  it("exporta o path de Foco de leitura", () => {
    expect(FOCUS_PATH).toBe("/focus");
  });
});
