import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileReadingService } from "./profileReading.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

describe("ProfileReadingService.getReadingShowcase", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeService() {
    const service = new ProfileReadingService();
    (
      service as unknown as {
        supabase: { rpc: typeof rpc };
      }
    ).supabase = { rpc };
    return service;
  }

  it("filtra RPCs pelo readerId e monta showcase com gêneros", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "get_community_reader_genres") {
        return {
          data: [
            {
              reader_id: "reader-a",
              gender: "fantasy",
              finished_count: 5,
              registered_count: 2,
            },
            {
              reader_id: "reader-b",
              gender: "romance",
              finished_count: 9,
              registered_count: 9,
            },
            {
              reader_id: "reader-a",
              gender: "romance",
              finished_count: 1,
              registered_count: 8,
            },
          ],
          error: null,
        };
      }

      if (name === "get_community_reader_activity") {
        return {
          data: [
            {
              reader_id: "reader-a",
              registered_count: 10,
              finished_count: 4,
              currently_reading_title: "Duna",
            },
            {
              reader_id: "reader-b",
              registered_count: 1,
              finished_count: 1,
              currently_reading_title: null,
            },
          ],
          error: null,
        };
      }

      return { data: [], error: null };
    });

    const showcase = await makeService().getReadingShowcase("reader-a");

    expect(showcase).toMatchObject({
      readerId: "reader-a",
      registeredCount: 10,
      finishedCount: 4,
      currentlyReadingTitle: "Duna",
      mostReadGender: "fantasy",
      mostRegisteredGender: "romance",
    });
    expect(showcase.mostReadGenderLabel).toBeTruthy();
    expect(showcase.mostRegisteredGenderLabel).toBeTruthy();
  });

  it("retorna zeros e gêneros nulos quando o leitor não aparece nas RPCs", async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const showcase = await makeService().getReadingShowcase("ghost");

    expect(showcase).toEqual({
      readerId: "ghost",
      registeredCount: 0,
      finishedCount: 0,
      currentlyReadingTitle: null,
      mostReadGender: null,
      mostRegisteredGender: null,
      mostReadGenderLabel: null,
      mostRegisteredGenderLabel: null,
    });
  });

  it("propaga erro da RPC de atividade", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "get_community_reader_genres") {
        return { data: [], error: null };
      }
      return { data: null, error: { message: "boom" } };
    });

    await expect(makeService().getReadingShowcase("reader-a")).rejects.toThrow(
      /Failed to load profile activity|boom/i,
    );
  });
});
