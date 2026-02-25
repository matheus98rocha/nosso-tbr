export type Status = "reading" | "finished" | "not_started";

export type BookPersistence = {
  id?: string;
  title: string;
  author: {
    name: string;
  };
  author_id: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string[];
  gender: string | null;
  image_url: string;
  user_id: string;
};

export type CreateBookPersistence = {
  id?: string;
  title: string;
  author_id: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string[];
  gender: string | null;
  image_url: string;
  user_id: string;
};

export type BookCreateValidator = {
  id?: string;
  title: string;
  author_id: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string;
  status?: Status;
  gender?: string | null;
  image_url: string;
  user_id?: string;
};

export type BookDomain = {
  id?: string;
  title: string;
  author: string;
  authorId?: string;
  chosen_by: "Matheus" | "Fabi" | "Barbara";
  pages: number;
  status?: Status;
  readers:
    | "Matheus"
    | "Fabi"
    | "Matheus e Fabir"
    | "Baraba e Fabi"
    | "Matheus e Barbara"
    | "Barbara,Fabi e Matheus";
  start_date?: string | null;
  end_date?: string | null;
  gender: string | null;
  image_url: string;
  user_id: string;
};
