import { STATS_PATH } from "./stats";

describe("stats routes", () => {
  it("exporta o path de Estatísticas", () => {
    expect(STATS_PATH).toBe("/stats");
  });
});
