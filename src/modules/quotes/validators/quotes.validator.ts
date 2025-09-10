import { z } from "zod";

export const createQuoteSchema = z.object({
  content: z.string().min(1, "O conteúdo da citação é obrigatório"),
  page: z.number().int().positive().optional(),
});

export type CreateQuoteFormInput = z.infer<typeof createQuoteSchema>;
