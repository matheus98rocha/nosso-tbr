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

import {
  getScheduleBookQueryFilterKey,
  getScheduleQueryKey,
} from "@/modules/schedule/utils/scheduleQueryKey";
import { useOptimisticScheduleDelete } from "./useOptimisticScheduleDelete";

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

describe("useOptimisticScheduleDelete", () => {
  const bookId = "book-1";
  const userId = "user-1";
  const scheduleKey = getScheduleQueryKey(bookId, userId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteSchedule.mockResolvedValue(undefined);
  });

  it("remove o cronograma do cache antes da resposta da API", async () => {
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
      () => useOptimisticScheduleDelete(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.deleteSchedule({ id: bookId });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(scheduleKey)).toEqual([]);
    });

    await waitFor(() => {
      expect(mockDeleteSchedule).toHaveBeenCalledWith(bookId, userId);
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
    mockDeleteSchedule.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useOptimisticScheduleDelete(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.deleteSchedule({ id: bookId });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(scheduleKey)).toEqual(previous);
    });
  });

  it("não dispara mutação quando userId está ausente", () => {
    const { queryClient, wrapper } = makeTestContext();
    queryClient.setQueryData(scheduleKey, []);

    const { result } = renderHook(
      () => useOptimisticScheduleDelete(bookId, undefined),
      { wrapper },
    );

    act(() => {
      result.current.deleteSchedule({ id: bookId });
    });

    expect(mockDeleteSchedule).not.toHaveBeenCalled();
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
      () => useOptimisticScheduleDelete(bookId, userId),
      { wrapper },
    );

    act(() => {
      result.current.deleteSchedule({ id: bookId });
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: getScheduleBookQueryFilterKey(bookId),
      });
    });
  });
});
