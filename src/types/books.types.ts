import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import z from "zod";

export type Status =
  | "reading"
  | "finished"
  | "not_started"
  | "planned"
  | "paused"
  | "abandoned";

export type BookPersistence = {
  id?: string;
  title: string;
  author: {
    name: string;
  } | null;
  author_id: string | null;
  chosen_by: string;
  pages: number;
  status?: Status;
  start_date?: string | null;
  planned_start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string | null;
  readers: string[];
  gender: string | null;
  image_url: string | null;
  user_id: string | null;
  is_reread?: boolean;
};

export type CreateBookPersistence = {
  id?: string;
  title: string;
  author_id: string;
  chosen_by: string;
  pages: number;
  status?: Status;
  start_date?: string | null;
  planned_start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string[];
  gender: string | null;
  image_url: string;
  /** `null` quando ausente; nunca string vazia (UUID inválido no Postgres). */
  user_id: string | null;
  is_reread?: boolean;
};
export type BookCreateValidator = z.infer<typeof bookCreateSchema>;

export type BookDomain = {
  id?: string;
  title: string;
  author: string;
  authorId?: string;
  chosen_by: string;
  pages: number;
  status?: Status;
  readerIds: string[];
  readersDisplay: string;
  start_date?: string | null;
  planned_start_date?: string | null;
  end_date?: string | null;
  gender: string | null;
  image_url: string;
  user_id: string;
  is_reread: boolean;
};
