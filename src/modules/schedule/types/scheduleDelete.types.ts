import type { ScheduleDomain } from "./schedule.types";

export type ScheduleDeleteVariables = {
  id: string;
};

export type ScheduleDeleteMutationContext = {
  previous: ScheduleDomain[] | undefined;
};
