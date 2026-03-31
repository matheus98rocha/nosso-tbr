import type { ScheduleDomain } from "./schedule.types";

export type ScheduleReadToggleVariables = {
  scheduleId: string;
  completed: boolean;
};

export type ScheduleReadToggleMutationContext = {
  previous: ScheduleDomain[] | undefined;
};
