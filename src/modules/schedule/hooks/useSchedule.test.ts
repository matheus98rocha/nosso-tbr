import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { useSchedule } from "./useSchedule";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

const mockGetByBookId = vi.fn();
const mockUpdateIsRead = vi.fn();
const mockDeleteSchedule = vi.fn();

vi.mock("../services/schedule.service", () => ({
  ScheduleUpsertService: vi.fn(function (this: Record<string, unknown>) {
    this.getByBookId = mockGetByBookId;
    this.updateIsRead = mockUpdateIsRead;
    this.deleteSchedule = mockDeleteSchedule;
  }),
}));

const mockCancelQueries = vi.fn();
const mockGetQueryData = vi.fn();
const mockSetQueryData = vi.fn();
const mockInvalidateQueries = vi.fn();

describe("useSchedule", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { useUserStore } = await import("@/stores/userStore");
    (useUserStore as Mock).mockReturnValue({ user: { id: "user-1" } });

    (useQueryClient as Mock).mockReturnValue({
      cancelQueries: mockCancelQueries,
      getQueryData: mockGetQueryData,
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    });

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "sch-1", completed: false }],
      isLoading: false,
    });

    (useMutation as Mock).mockImplementation((cfg) => ({
      mutate: vi.fn((payload) => cfg?.mutationFn?.(payload)),
      isPending: false,
    }));
  });

  it("enables schedule query only when user exists", async () => {
    const { useUserStore } = await import("@/stores/userStore");
    (useUserStore as Mock).mockReturnValue({ user: null });

    renderHook(() => useSchedule({ id: "book-1" }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("computes table and empty states from query data", () => {
    const { result, rerender } = renderHook(() => useSchedule({ id: "book-1" }));

    expect(result.current.shouldDisplayScheduleTable).toBe(true);
    expect(result.current.emptySchedule).toBe(false);

    (useQuery as Mock).mockReturnValue({ data: [], isLoading: false });
    rerender();

    expect(result.current.emptySchedule).toBe(true);
  });

  it("wires update mutation to service with authenticated user", () => {
    renderHook(() => useSchedule({ id: "book-1" }));

    const firstMutationConfig = (useMutation as Mock).mock.calls[0][0];
    firstMutationConfig.mutationFn({ id: "sch-1", isRead: true });
    expect(mockUpdateIsRead).toHaveBeenCalledWith("sch-1", true, "user-1");
  });

  it("uses the same cache key for optimistic update and rollback", async () => {
    renderHook(() => useSchedule({ id: "book-1" }));

    const firstMutationConfig = (useMutation as Mock).mock.calls[0][0];
    mockGetQueryData.mockReturnValue([{ id: "sch-1", completed: false }]);

    const context = await firstMutationConfig.onMutate({
      id: "sch-1",
      isRead: true,
    });

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: ["schedule", "book-1", "user-1"],
    });
    expect(mockGetQueryData).toHaveBeenCalledWith([
      "schedule",
      "book-1",
      "user-1",
    ]);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["schedule", "book-1", "user-1"],
      expect.any(Function),
    );

    firstMutationConfig.onError(new Error("boom"), {}, context);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["schedule", "book-1", "user-1"],
      [{ id: "sch-1", completed: false }],
    );

    firstMutationConfig.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["schedule", "book-1", "user-1"],
    });
  });
});
