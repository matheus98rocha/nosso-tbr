import { z } from "zod";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

const ALLOWED_IMAGE_HOST_RE =
  /^https:\/\/(?:.*\.)?(amazon\.com|amazon\.com\.br|media\-amazon\.com|m\.media\-amazon\.com|ssl\-images\-amazon\.com|books\.google\.com|covers\.openlibrary\.org)/;

export const bookCreateSchema = z.object({
  title: z.string().min(1, { message: "O título do livro é obrigatório" }),
  author_ids: z
    .array(z.string().min(1))
    .min(1, { message: "Selecione ao menos um autor" }),
  chosen_by: z.string().min(1, { message: "Quem escolheu o livro é obrigatório" }),
  pages: z
    .number({
      message: "O número de páginas é obrigatório",
    })
    .int("O número de páginas deve ser inteiro")
    .positive("O número de páginas deve ser positivo"),
  start_date: z.string().nullable().optional(),
  planned_start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  readers: z
    .array(z.string().min(1))
    .min(1, { message: "Selecione ao menos um leitor" }),
  base_readers: z.array(z.string().min(1)).optional(),
  gender: z.string().nullable().optional(),
  image_url: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (
        val === undefined ||
        val.trim() === "" ||
        val.trim() === BOOK_COVER_PLACEHOLDER_SRC
      ) {
        return;
      }
      const trimmed = val.trim();
      const urlCheck = z.string().url().safeParse(trimmed);
      if (!urlCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A URL da imagem deve ser um endereço válido",
        });
        return;
      }
      if (!ALLOWED_IMAGE_HOST_RE.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A URL da imagem deve ser da Amazon, Google Books ou Open Library",
        });
      }
    }),
  user_id: z.string().optional(),
  id: z.string().optional(),
  is_reread: z.boolean().optional(),
  status: z
    .enum([
      "reading",
      "finished",
      "not_started",
      "planned",
      "paused",
      "abandoned",
    ])
    .optional(),
});
