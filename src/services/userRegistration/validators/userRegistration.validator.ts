import { z } from "zod";

export const registerUserBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  display_name: z.string().trim().min(1).max(200),
});

export type RegisterUserBody = z.infer<typeof registerUserBodySchema>;
