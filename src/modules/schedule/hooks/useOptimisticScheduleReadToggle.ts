import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";
import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";
import {
  ScheduleReadToggleMutationContext,
  ScheduleReadToggleVariables,
} from "@/modules/schedule/types/scheduleReadToggle.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const service = new ScheduleUpsertService();

export function useOptimisticScheduleReadToggle(
  bookId: string,
  userId: string | undefined,
) {
  const queryClient = useQueryClient();

  const scheduleQueryKey = useMemo(
    () => ["schedule", bookId, userId] as const,
    [bookId, userId],
  );

  const mutation = useMutation({
    mutationFn: async ({
      scheduleId,
      completed,
    }: ScheduleReadToggleVariables) => {
      if (!userId) {
        throw new Error("User required");
      }
      await service.updateIsRead(scheduleId, completed, userId);
    },
    onMutate: async ({
      scheduleId,
      completed,
    }: ScheduleReadToggleVariables): Promise<ScheduleReadToggleMutationContext> => {
      await queryClient.cancelQueries({ queryKey: scheduleQueryKey });
      const previous = queryClient.getQueryData<ScheduleDomain[]>(
        scheduleQueryKey,
      );
      queryClient.setQueryData<ScheduleDomain[]>(scheduleQueryKey, (old) =>
        (old ?? []).map((day) =>
          day.id === scheduleId ? { ...day, completed } : day,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(scheduleQueryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedule", bookId] });
    },
  });

  const { mutate, isPending, variables } = mutation;

  const updateRead = useCallback(
    (scheduleId: string, completed: boolean) => {
      if (!userId || !scheduleId) {
        return;
      }
      mutate({ scheduleId, completed });
    },
    [userId, mutate],
  );

  const pendingScheduleId = variables?.scheduleId ?? null;

  return {
    updateRead,
    isReadTogglePending: isPending,
    pendingScheduleId,
  };
}
