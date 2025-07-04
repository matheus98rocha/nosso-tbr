import { z } from "zod";

export const bookCreateSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  chosen_by: z.enum(["Matheus", "Fabi", "Barbara"]),
  pages: z.number().int().positive(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  readers: z.string().min(1),
});

export type BookCreateValidator = z.infer<typeof bookCreateSchema>;
