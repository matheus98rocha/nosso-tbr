import { useMemo } from "react";

import type { ScheduleDomain } from "../types/schedule.types";
import { computeSchedulePace } from "../utils/computeSchedulePace";
import { getTodayInSaoPaulo } from "../utils/getTodayInSaoPaulo";

export function useScheduleReadingPace(
  schedule: readonly ScheduleDomain[] | undefined | null,
) {
  const today = useMemo(() => getTodayInSaoPaulo(), []);

  const pace = useMemo(
    () => computeSchedulePace(schedule, today),
    [schedule, today],
  );

  return useMemo(() => ({ pace }), [pace]);
}
