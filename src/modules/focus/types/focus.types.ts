import type { Status } from "@/types/books.types";

export type FocusTimerStatus = "idle" | "running" | "paused" | "finished";

export type FocusMode = "timer" | "stopwatch";

export type FocusBook = {
  id: string;
  title: string;
  author: string;
  authorIds: string[];
  imageUrl: string;
  pages: number;
  currentPage: number;
  readerIds: string[];
  chosenBy: string;
  userId: string;
  startDate: string | null;
  gender: string | null;
  isReread: boolean;
  status: Status;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  mode: FocusMode;
  bookId: string | null;
  goalPages: number | null;
  pagesRead: number;
  finishedPage: number | null;
};

export type FocusActiveSession = {
  mode: FocusMode;
  status: FocusTimerStatus;
  startedAt: string | null;
  endsAt: string | null;
  accumulatedSeconds: number;
  durationSeconds: number;
  selectedBookId: string | null;
  goalPages: number | null;
  targetPage: number | null;
  muted: boolean;
  updatedAt: string;
};

export type FocusPageProgress = Record<string, number>;

export type FocusSummaryInput = {
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  mode: FocusMode;
  book: FocusBook | null;
  goalPages: number | null;
  estimatedPages: number;
};
