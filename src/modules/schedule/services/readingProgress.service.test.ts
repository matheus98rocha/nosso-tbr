import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockApiJson } = vi.hoisted(() => ({
  mockApiJson: vi.fn(),
}));

vi.mock("@/lib/api/clientJsonFetch", () => ({
  apiJson: mockApiJson,
}));

vi.mock("@/services/errors/error", () => ({
  ErrorHandler: {
    normalize: (error: unknown) =>
      error instanceof Error ? error : new Error(String(error)),
    log: vi.fn(),
  },
}));

import { ReadingProgressService } from "./readingProgress.service";

describe("ReadingProgressService", () => {
  let service: ReadingProgressService;

  beforeEach(() => {
    service = new ReadingProgressService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMany", () => {
    it("curto-circuita devolvendo [] sem disparar HTTP quando bookIds está vazio", async () => {
      const result = await service.getMany([]);
      expect(result).toEqual([]);
      expect(mockApiJson).not.toHaveBeenCalled();
    });

    it("monta a URL com CSV dos bookIds e usa método GET", async () => {
      mockApiJson.mockResolvedValueOnce([]);

      await service.getMany(["a", "b", "c"]);

      expect(mockApiJson).toHaveBeenCalledTimes(1);
      const [path, init] = mockApiJson.mock.calls[0];
      expect(path).toBe("/api/schedule/progress?bookIds=a%2Cb%2Cc");
      expect(init).toEqual({ method: "GET" });
    });

    it("repassa o payload de progresso recebido da API", async () => {
      const payload = [
        { book_id: "a", total: 10, completed: 4 },
        { book_id: "b", total: 5, completed: 5 },
      ];
      mockApiJson.mockResolvedValueOnce(payload);

      const result = await service.getMany(["a", "b"]);
      expect(result).toBe(payload);
    });

    it("propaga erros normalizados quando a API falha", async () => {
      mockApiJson.mockRejectedValueOnce(new Error("network down"));

      await expect(service.getMany(["a"])).rejects.toThrow("network down");
    });
  });
});
