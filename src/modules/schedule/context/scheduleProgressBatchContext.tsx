"use client";

import { createContext } from "react";
import type { ReadingProgressByBookId } from "../types/readingProgress.types";

export type ScheduleProgressBatchContextValue = {
  readingBookIds: readonly string[];
  progressByBookId: ReadingProgressByBookId;
  isLoading: boolean;
  isError: boolean;
};

export const ScheduleProgressBatchContext = createContext<
  ScheduleProgressBatchContextValue | undefined
>(undefined);
