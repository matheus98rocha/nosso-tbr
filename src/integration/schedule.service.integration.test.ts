import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq }));

mockEq.mockImplementation(() => ({ eq: mockEq, order: mockOrder }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
    })),
  })),
}));

import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";

describe("ScheduleUpsertService integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockImplementation(() => ({ eq: mockEq, order: mockOrder }));
  });

  it("returns domain schedule ordered by date on happy path", async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "sch-1",
          book_id: "book-1",
          owner: "user-1",
          date: "2025-05-10T00:00:00.000Z",
          chapters: "1-3",
          completed: true,
        },
      ],
      error: null,
    });

    const service = new ScheduleUpsertService();
    const result = await service.getByBookId("book-1", "user-1");

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenNthCalledWith(1, "book_id", "book-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "owner", "user-1");
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: true });

    expect(result).toEqual([
      {
        id: "sch-1",
        owner: "user-1",
        chapters: "1-3",
        completed: true,
        date: expect.any(String),
      },
    ]);
  });
});
