import { z } from "zod";

export const DUPLICATE_AUTHOR_MESSAGE = "Já existe um autor com esse nome.";

export const authorNameBody = z.object({
  name: z.string().trim().min(1),
});
