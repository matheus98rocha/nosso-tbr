import { z } from "zod";

export const bookshelfCreateSchema = z.object({
  name: z
    .string()
    .min(2, { message: "O nome da estante deve ter no mínimo 2 caracteres" })
    .max(100, {
      message: "O nome da estante deve ter no máximo 100 caracteres",
    }),
});

export type BookshelfCreateValidator = z.infer<typeof bookshelfCreateSchema>;
