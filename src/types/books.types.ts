import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import z from "zod";

export type Status = "reading" | "finished" | "not_started" | "planned";

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
  planned_start_date?: string | null;
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
  planned_start_date?: string | null;
  end_date?: string | null;
  inserted_at?: string;
  readers: string[];
  gender: string | null;
  image_url: string;
  user_id: string;
};
export type BookCreateValidator = z.infer<typeof bookCreateSchema> & {
  id?: string;
  status?: Status;
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
    | "Matheus e Fabi"
    | "Barbara e Fabi"
    | "Matheus e Barbara"
    | "Barbara, Fabi e Matheus";
  start_date?: string | null;
  planned_start_date?: string | null;
  end_date?: string | null;
  gender: string | null;
  image_url: string;
  user_id: string;
};
