export interface QuoteDomain {
  id: string;
  bookId: string;
  bookTitle?: string;
  content: string;
  page: number | null;
  createdAt: string;
}

export type QuotePersistence = {
  id: string;
  book_id: string;
  content: string;
  page: number | null;
  created_at: string;
};
