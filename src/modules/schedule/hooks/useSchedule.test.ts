import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { useSchedule } from "./useSchedule";
import { useQuery } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

const { mockUpdateRead, mockDeleteSchedule } = vi.hoisted(() => ({
  mockUpdateRead: vi.fn(),
  mockDeleteSchedule: vi.fn(),
}));

vi.mock("./useOptimisticScheduleReadToggle", () => ({
  useOptimisticScheduleReadToggle: vi.fn(() => ({
    updateRead: mockUpdateRead,
    isReadTogglePending: false,
    pendingScheduleId: null,
  })),
}));

vi.mock("./useOptimisticScheduleDelete", () => ({
  useOptimisticScheduleDelete: vi.fn(() => ({
    deleteSchedule: mockDeleteSchedule,
    isPendingDelete: false,
  })),
}));

describe("useSchedule", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { useUserStore } = await import("@/stores/userStore");
    (useUserStore as Mock).mockReturnValue({ user: { id: "user-1" } });

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "sch-1", completed: false }],
      isLoading: false,
    });
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

  it("wires optimistic read toggle hook", () => {
    const { result } = renderHook(() => useSchedule({ id: "book-1" }));

    result.current.updateIsCompleted({ id: "sch-1", isRead: true });

    expect(mockUpdateRead).toHaveBeenCalledWith("sch-1", true);
  });

  it("exposes deleteSchedule from optimistic delete hook", () => {
    const { result } = renderHook(() => useSchedule({ id: "book-1" }));

    expect(result.current.deleteSchedule).toBe(mockDeleteSchedule);
  });
});
