import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { useOptimisticScheduleDelete } from "./useOptimisticScheduleDelete";
import { useOptimisticScheduleReadToggle } from "./useOptimisticScheduleReadToggle";

type UseScheduleProps = {
  id: string;
};

export function useSchedule({ id: bookId }: UseScheduleProps) {
  const scheduleService = new ScheduleUpsertService();
  const { user } = useUserStore();

  const { data: schedule, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["schedule", bookId, user?.id],
    queryFn: () => scheduleService.getByBookId(bookId, user!.id),
    enabled: !!user?.id,
  });

  const {
    updateRead,
    isReadTogglePending,
    pendingScheduleId,
  } = useOptimisticScheduleReadToggle(bookId, user?.id);

  const updateIsCompleted = useCallback(
    ({ id: scheduleRowId, isRead }: { id: string; isRead: boolean }) => {
      updateRead(scheduleRowId, isRead);
    },
    [updateRead],
  );

  const { deleteSchedule, isPendingDelete } = useOptimisticScheduleDelete(
    bookId,
    user?.id,
  );

  const isLoadingSchedule = isLoadingSchedules || isPendingDelete;
  const shouldDisplayScheduleTable =
    !isLoadingSchedule && schedule && schedule.length > 0 && !isPendingDelete;
  const emptySchedule = schedule && schedule.length === 0;

  return useMemo(
    () => ({
      schedule,
      updateIsCompleted,
      deleteSchedule,
      shouldDisplayScheduleTable,
      isLoadingSchedule,
      emptySchedule,
      isReadTogglePending,
      pendingScheduleId,
    }),
    [
      schedule,
      updateIsCompleted,
      deleteSchedule,
      shouldDisplayScheduleTable,
      isLoadingSchedule,
      emptySchedule,
      isReadTogglePending,
      pendingScheduleId,
    ],
  );
}
