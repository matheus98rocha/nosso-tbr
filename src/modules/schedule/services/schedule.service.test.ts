import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, ErrorHandler } from "@/services/errors/error";

const {
  mockInsert,
  mockSelect,
  mockEq,
  mockOrder,
  mockUpdate,
  mockDelete,
  mockToPersistence,
  mockToDomain,
} = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockOrder: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockToPersistence: vi.fn(),
  mockToDomain: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      update: mockUpdate,
      delete: mockDelete,
    })),
  })),
}));

vi.mock("./mappers/schedule.mapper", () => ({
  ScheduleUpsertMapper: {
    toPersistence: mockToPersistence,
    toDomain: mockToDomain,
  },
}));

import { ScheduleUpsertService } from "./schedule.service";

describe("ScheduleUpsertService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, "log").mockImplementation(() => undefined);

    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }));
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
    }));
  });

  it("creates many schedules using mapper payload", async () => {
    const input = [
      { book_id: "book-1", owner: "user-1", date: new Date(), chapters: "1-2" },
    ];
    mockToPersistence.mockReturnValue({ mapped: true });
    mockInsert.mockResolvedValue({ error: null });

    const service = new ScheduleUpsertService();
    await service.createMany(input as never);

    expect(mockToPersistence).toHaveBeenCalledWith(input[0]);
    expect(mockInsert).toHaveBeenCalledWith([{ mapped: true }]);
  });

  it("normalizes and rethrows when createMany fails", async () => {
    const input = [
      { book_id: "book-1", owner: "user-1", date: new Date(), chapters: "1-2" },
    ];
    mockToPersistence.mockReturnValue({ mapped: true });
    mockInsert.mockResolvedValue({ error: { message: "db fail" } });

    const service = new ScheduleUpsertService();

    await expect(service.createMany(input as never)).rejects.toBeInstanceOf(AppError);
  });

  it("fetches by book and maps to domain", async () => {
    const row = { id: "s1" };
    mockOrder.mockResolvedValue({ data: [row], error: null });
    mockToDomain.mockReturnValue({ id: "s1", date: "10/10/2025" });

    const service = new ScheduleUpsertService();
    const result = await service.getByBookId("book-1", "user-1");

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenNthCalledWith(1, "book_id", "book-1");
    expect(mockEq).toHaveBeenNthCalledWith(2, "owner", "user-1");
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: true });
    expect(result).toEqual([{ id: "s1", date: "10/10/2025" }]);
  });

  it("normalizes and rethrows when getByBookId fails", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "broken" } });

    const service = new ScheduleUpsertService();

    await expect(service.getByBookId("book-1", "user-1")).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("updates read status scoped by owner", async () => {
    const eqOwner = vi.fn().mockResolvedValue({ error: null });
    const eqId = vi.fn(() => ({ eq: eqOwner }));
    mockUpdate.mockReturnValue({ eq: eqId });

    const service = new ScheduleUpsertService();
    await service.updateIsRead("schedule-1", true, "user-1");

    expect(mockUpdate).toHaveBeenCalledWith({ completed: true });
    expect(eqId).toHaveBeenCalledWith("id", "schedule-1");
    expect(eqOwner).toHaveBeenCalledWith("owner", "user-1");
  });

  it("deletes schedule by book and owner", async () => {
    const eqOwner = vi.fn().mockResolvedValue({ error: null });
    const eqBook = vi.fn(() => ({ eq: eqOwner }));
    mockDelete.mockReturnValue({ eq: eqBook });

    const service = new ScheduleUpsertService();
    await service.deleteSchedule("book-1", "user-1");

    expect(eqBook).toHaveBeenCalledWith("book_id", "book-1");
    expect(eqOwner).toHaveBeenCalledWith("owner", "user-1");
  });
});
