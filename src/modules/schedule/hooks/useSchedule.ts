import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScheduleUpsertService } from "../services/schedule.service";
import { ScheduleDomain } from "../types/schedule.types";
import { useUserStore } from "@/stores/userStore";

type UseScheduleProps = {
  id: string;
};

export function useSchedule({ id }: UseScheduleProps) {
  const queryClient = useQueryClient();
  const scheduleService = new ScheduleUpsertService();
  const { user } = useUserStore();

  const { data: schedule, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["schedule", id, user?.id],
    queryFn: () => scheduleService.getByBookId(id, user!.id),
    enabled: !!user?.id,
  });

  const { mutate: updateIsCompleted } = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => {
      return scheduleService.updateIsRead(id, isRead, user!.id);
    },

    onMutate: async ({ id: scheduleId, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ["schedule", id, user?.id] });

      const previousSchedule = queryClient.getQueryData<ScheduleDomain[]>([
        "schedule",
        id,
        user?.id,
      ]);

      queryClient.setQueryData<ScheduleDomain[]>(["schedule", id, user?.id], (old) =>
        old?.map((day) =>
          day.id === scheduleId ? { ...day, completed: isRead } : day,
        ),
      );

      return { previousSchedule };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousSchedule) {
        queryClient.setQueryData(["schedule", id, user?.id], context.previousSchedule);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", id, user?.id] });
    },
  });

  const { mutate: deleteSchedule, isPending: isPendingDelete } = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return scheduleService.deleteSchedule(id, user!.id);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ScheduleDomain[]>(
        ["schedule", variables.id, user?.id],
        [],
      );
    },
  });

  const isLoadingSchedule = isLoadingSchedules || isPendingDelete;
  const shouldDisplayScheduleTable =
    !isLoadingSchedule && schedule && schedule.length > 0 && !isPendingDelete;
  const emptySchedule = schedule && schedule.length === 0;

  return {
    schedule,
    updateIsCompleted,
    deleteSchedule,
    shouldDisplayScheduleTable,
    isLoadingSchedule,
    emptySchedule,
  };
}
