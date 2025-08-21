import { useQuery } from "@tanstack/react-query";
import { ScheduleUpsertService } from "../services/schedule.service";
import { ClientScheduleProps } from "../types/schedule.types";

export function useSchedule({ id }: ClientScheduleProps) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => {
      const scheduleService = new ScheduleUpsertService();
      return scheduleService.getByBookId(id);
    },
  });

  return {
    schedule,
    isLoading,
  };
}
