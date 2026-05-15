export type BookLookupData = {
  nome_do_livro: string;
  url_capa: string | null;
  autor: string | null;
  genero: string | null;
  paginas: number | null;
  isbn_13: string | null;
  isbn_10: string | null;
  fonte: "open_library" | "google_books" | string;
};

export type BookLookupResponse = {
  book: BookLookupData;
  query: string;
  source_count: number;
};
