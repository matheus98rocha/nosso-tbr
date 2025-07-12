export type Status = "reading" | "finished" | "not_started";

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
  gender: string | null;
  image_url: string;
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
  status?: Status;
  gender?: string | null;
  image_url: string;
};

export type BookDomain = {
  id?: string;
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  status?: Status;
  readers: "Matheus" | "Fabi" | "Matheus e Fabir" | "Baraba e Fabi";
  start_date?: string | null;
  end_date?: string | null;
  gender: string | null;
  image_url: string;
};
