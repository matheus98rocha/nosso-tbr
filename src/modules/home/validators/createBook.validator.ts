import { z } from "zod";

export const bookCreateSchema = z.object({
  title: z.string().min(1, { message: "O título do livro é obrigatório" }),
  author: z.string().min(1, { message: "O autor do livro é obrigatório" }),
  chosen_by: z.enum(["Matheus", "Fabi", "Barbara"], {
    message: "Quem escolheu o livro é obrigatório",
  }),
  // No seu arquivo createBook.validator.ts
  pages: z
    .number({
      message: "O número de páginas é obrigatório",
    })
    .int("O número de páginas deve ser inteiro")
    .positive("O número de páginas deve ser positivo"),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  readers: z.string().min(1, { message: "O leitor é obrigatório" }),
  gender: z.string().nullable().optional(),
  image_url: z
    .url({ message: "A URL da imagem deve ser um endereço válido" })
    .refine(
      (url) =>
        !url ||
        /^https:\/\/(?:.*\.)?(amazon\.com|amazon\.com\.br|media\-amazon\.com|m\.media\-amazon\.com|ssl\-images\-amazon\.com)/.test(
          url
        ),
      {
        message: "A URL da imagem deve ser de um domínio da Amazon válido",
      }
    ),
});

export type BookCreateValidator = z.infer<typeof bookCreateSchema>;
