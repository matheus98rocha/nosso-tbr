export interface BookCandidate {
  title: string;
  author_name: string | null;
  pages: number | null;
  image_url: string | null;
  gender: string | null;
  publisher: string | null;
  published_date: string | null;
  isbn: string | null;
  source: "google_books" | "open_library";
}

export interface BookSearchResponse {
  candidates: BookCandidate[];
  query: string;
  total: number;
}
