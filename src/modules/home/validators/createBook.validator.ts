import { z } from "zod";

const AMAZON_IMAGE_HOST_RE =
  /^https:\/\/(?:.*\.)?(amazon\.com|amazon\.com\.br|media\-amazon\.com|m\.media\-amazon\.com|ssl\-images\-amazon\.com)/;

export const bookCreateSchema = z.object({
  title: z.string().min(1, { message: "O título do livro é obrigatório" }),
  author_id: z.string().min(1, { message: "O autor do livro é obrigatório" }),
  chosen_by: z.enum(["Matheus", "Fabi", "Barbara"], {
    message: "Quem escolheu o livro é obrigatório",
  }),
  pages: z
    .number({
      message: "O número de páginas é obrigatório",
    })
    .int("O número de páginas deve ser inteiro")
    .positive("O número de páginas deve ser positivo"),
  start_date: z.string().nullable().optional(),
  planned_start_date: z.string().nullable().optional(), // Adicionado
  end_date: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  readers: z.string().min(1, { message: "O leitor é obrigatório" }),
  gender: z.string().nullable().optional(),
  image_url: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val === undefined || val.trim() === "") return;
      const trimmed = val.trim();
      const urlCheck = z.string().url().safeParse(trimmed);
      if (!urlCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A URL da imagem deve ser um endereço válido",
        });
        return;
      }
      if (!AMAZON_IMAGE_HOST_RE.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A URL da imagem deve ser de um domínio da Amazon válido",
        });
      }
    }),
  user_id: z.string().optional(),
  id: z.string().optional(),
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
