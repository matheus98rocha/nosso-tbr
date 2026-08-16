export type ReadingProgressPersistence = {
  book_id: string;
  total: number;
  completed: number;
  overdue?: number;
  ahead?: number;
  last_date?: string;
};

export type ReadingProgressDomain = {
  bookId: string;
  total: number;
  completed: number;
  percentage: number;
};

export type ReadingProgressByBookId = Map<string, ReadingProgressDomain>;
