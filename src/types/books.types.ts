export type BookPersistence = {
  id?: string;
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string[];
};
export type BookCreateValidator = {
  id?: string;
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string;
};

export type BookDomain = {
  id?: string;
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  status?: "reading" | "finished" | "not_started";
  readers: "Matheus" | "Fabi" | "Matheus e Fabir" | "Baraba e Fabi";
};
