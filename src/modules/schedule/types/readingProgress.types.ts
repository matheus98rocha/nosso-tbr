export type ReadingProgressPersistence = {
  book_id: string;
  total: number;
  completed: number;
};

export type ReadingProgressDomain = {
  bookId: string;
  total: number;
  completed: number;
  percentage: number;
};

export type ReadingProgressByBookId = Map<string, ReadingProgressDomain>;
