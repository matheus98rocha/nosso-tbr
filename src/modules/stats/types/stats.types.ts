import type { ReactNode } from "react";

export type StatsPersistence = {
  year: number;
  total_books: number;
  most_read_author: string;
  most_read_genre: string;
  total_pages: number;
  most_productive_month: string;
  longest_book_title: string;
  longest_book_pages: number;
  avg_pages_per_book: number;
};

export interface StatsDomain {
  year: number;
  totalBooks: number;
  mostReadAuthor: string | null;
  mostReadGenre: string | null;
  totalPages: number | null;
  mostProductiveMonth: string | null;
  longestBookTitle: string | null;
  longestBookPages: number | null;
  avgPagesPerBook: number | null;
}

export type CollaborationStatsPersistence = {
  reader_name: string;
  books_read: number;
};

export interface CollaborationStatsDomain {
  readerName: string;
  booksRead: number;
}

export type ReadingLeaderboardPersistence = {
  reader_id: string;
  display_name: string;
  books_read: number;
  total_pages: number;
};

export interface ReadingLeaderboardEntryDomain {
  readerId: string;
  displayName: string;
  booksRead: number;
  totalPages: number;
  rank: number;
}

export type EstatisticaAnual = {
  year: number;
  totalBooks: number;
  totalPages: number;
  mostReadGenre: string;
  mostReadAuthor: string;
};

export type StatsClientProps = {
  yearlyStats: EstatisticaAnual[];
  collaborators: CollaborationStatsDomain[];
  totalBooks: number;
};

export type KpiCardProps = {
  title: string;
  value: ReactNode;
  icon: ReactNode;
};
