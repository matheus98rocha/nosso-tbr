export type BookPersistence = {
  id: string; // uuid
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi";
  pages: number;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
};

export type BookDomain = {
  id: string; // uuid
  title: string;
  author: string;
  chosen_by: "Matheus" | "Fabi";
  pages: number;
  status?: "reading" | "finished" | "not_started";
};
