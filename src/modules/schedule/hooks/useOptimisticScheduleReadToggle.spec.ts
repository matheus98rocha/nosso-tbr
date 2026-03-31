import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpdateIsRead, mockDeleteSchedule } = vi.hoisted(() => ({
  mockUpdateIsRead: vi.fn(),
  mockDeleteSchedule: vi.fn(),
}));

vi.mock("@/modules/schedule/services/schedule.service", () => ({
  ScheduleUpsertService: class {
    updateIsRead = mockUpdateIsRead;
    deleteSchedule = mockDeleteSchedule;
  },
}));

import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";
import { useOptimisticScheduleReadToggle } from "./useOptimisticScheduleReadToggle";

function makeTestContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper, invalidateQueries };
}

describe("useOptimisticScheduleReadToggle", () => {
  const bookId = "book-1";
  const userId = "user-1";
  const scheduleKey = ["schedule", bookId, userId] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateIsRead.mockResolvedValue(undefined);
  });

  it("atualiza o cache antes da resposta da API", async () => {
    const { queryClient, wrapper } = makeTestContext();
    queryClient.setQueryData(scheduleKey, [
      {
        id: "row-1",
        owner: userId,
        date: "2024-01-01",
        chapters: "1",
        completed: false,
      },
    ]);

    const { result } = renderHook(
      () => useOptimisticScheduleReadToggle(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.updateRead("row-1", true);
    });

    await waitFor(() => {
      const data = queryClient.getQueryData<ScheduleDomain[]>(scheduleKey);
      expect(data?.[0]?.completed).toBe(true);
    });

    await waitFor(() => {
      expect(mockUpdateIsRead).toHaveBeenCalledWith("row-1", true, userId);
    });
  });

  it("restaura o cache quando a API falha", async () => {
    const { queryClient, wrapper } = makeTestContext();
    const previous = [
      {
        id: "row-1",
        owner: userId,
        date: "2024-01-01",
        chapters: "1",
        completed: false,
      },
    ];
    queryClient.setQueryData(scheduleKey, previous);
    mockUpdateIsRead.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useOptimisticScheduleReadToggle(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.updateRead("row-1", true);
    });

    await waitFor(() => {
      const data = queryClient.getQueryData<ScheduleDomain[]>(scheduleKey);
      expect(data?.[0]?.completed).toBe(false);
    });
  });

  it("não dispara mutação quando userId está ausente", () => {
    const { queryClient, wrapper } = makeTestContext();
    queryClient.setQueryData(scheduleKey, []);

    const { result } = renderHook(
      () => useOptimisticScheduleReadToggle(bookId, undefined),
      { wrapper },
    );

    act(() => {
      result.current.updateRead("row-1", true);
    });

    expect(mockUpdateIsRead).not.toHaveBeenCalled();
  });

  it("invalida consultas do cronograma ao finalizar a mutação", async () => {
    const { queryClient, wrapper, invalidateQueries } = makeTestContext();
    queryClient.setQueryData(scheduleKey, [
      {
        id: "row-1",
        owner: userId,
        date: "2024-01-01",
        chapters: "1",
        completed: false,
      },
    ]);

    const { result } = renderHook(
      () => useOptimisticScheduleReadToggle(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.updateRead("row-1", true);
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["schedule", bookId],
      });
    });
  });
});
