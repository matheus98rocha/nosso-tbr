import { BookDomain } from "@/types/books.types";

export type BookshelvesDomain = {
  shelfName: string;
  books: BookDomain[];
};

export type BookshelvesPersistence = {
  book: [
    {
      id: string;
      pages: number;
      title: string;
      author: string;
      gender: string;
      readers: string[];
      end_date: string | null;
      chosen_by: string;
      image_url: string;
      start_date: string | null;
      inserted_at: string;
    }
  ];
  shelf: [
    {
      name: string;
    }
  ];
}[];
