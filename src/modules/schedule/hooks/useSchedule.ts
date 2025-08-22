import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScheduleUpsertService } from "../services/schedule.service";
import { ScheduleDomain } from "../types/schedule.types";

type UseScheduleProps = {
  id: string;
  startDate: string;
};

export function useSchedule({ id }: UseScheduleProps) {
  const queryClient = useQueryClient();
  const scheduleService = new ScheduleUpsertService();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => scheduleService.getByBookId(id),
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
        old?.map((day) => (day.id === id ? { ...day, completed: isRead } : day))
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  return {
    schedule,
    isLoading,
    updateIsCompleted,
    deleteSchedule,
    isPendingDelete,
  };
}
