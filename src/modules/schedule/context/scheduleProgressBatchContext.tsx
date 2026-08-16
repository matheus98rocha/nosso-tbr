"use client";

import { createContext } from "react";

import type { ReadingProgressByBookId } from "../types/readingProgress.types";
import type { SchedulePaceByBookId } from "../types/schedulePace.types";

export type ScheduleProgressBatchContextValue = {
  readingBookIds: readonly string[];
  progressByBookId: ReadingProgressByBookId;
  paceByBookId: SchedulePaceByBookId;
  isLoading: boolean;
  isError: boolean;
};

export const ScheduleProgressBatchContext = createContext<
  ScheduleProgressBatchContextValue | undefined
>(undefined);
