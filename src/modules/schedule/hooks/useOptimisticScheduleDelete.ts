import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";
import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";
import {
  ScheduleDeleteMutationContext,
  ScheduleDeleteVariables,
} from "@/modules/schedule/types/scheduleDelete.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const service = new ScheduleUpsertService();

export function useOptimisticScheduleDelete(
  bookId: string,
  userId: string | undefined,
) {
  const queryClient = useQueryClient();

  const scheduleQueryKey = useMemo(
    () => ["schedule", bookId, userId] as const,
    [bookId, userId],
  );

  const mutation = useMutation({
    mutationFn: async ({ id: targetBookId }: ScheduleDeleteVariables) => {
      if (!userId) {
        throw new Error("User required");
      }
      await service.deleteSchedule(targetBookId, userId);
    },
    onMutate: async (): Promise<ScheduleDeleteMutationContext> => {
      await queryClient.cancelQueries({ queryKey: scheduleQueryKey });
      const previous = queryClient.getQueryData<ScheduleDomain[]>(
        scheduleQueryKey,
      );
      queryClient.setQueryData(scheduleQueryKey, []);
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

  const { mutate, isPending } = mutation;

  const deleteSchedule = useCallback(
    (payload: ScheduleDeleteVariables) => {
      if (!userId) {
        return;
      }
      mutate(payload);
    },
    [userId, mutate],
  );

  return {
    deleteSchedule,
    isPendingDelete: isPending,
  };
}
