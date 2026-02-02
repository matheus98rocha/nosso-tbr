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

  console.log("useSchedule - user:", user);

  const { data: schedule, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["schedule", id, user?.id],
    queryFn: () => scheduleService.getByBookId(id, user!.id),
    enabled: !!user?.id,
  });

  const { mutate: updateIsCompleted } = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => {
      return scheduleService.updateIsRead(id, isRead);
    },

    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ["schedule", id] });

      const previousSchedule = queryClient.getQueryData<ScheduleDomain[]>([
        "schedule",
        id,
      ]);

      queryClient.setQueryData<ScheduleDomain[]>(["schedule", id], (old) =>
        old?.map((day) =>
          day.id === id ? { ...day, completed: isRead } : day,
        ),
      );

      return { previousSchedule };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousSchedule) {
        queryClient.setQueryData(["schedule", id], context.previousSchedule);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });
    },
  });

  const { mutate: deleteSchedule, isPending: isPendingDelete } = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return scheduleService.deleteSchedule(id);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ScheduleDomain[]>(
        ["schedule", variables.id],
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
