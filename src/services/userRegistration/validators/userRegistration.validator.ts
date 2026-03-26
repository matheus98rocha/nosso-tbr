import { z } from "zod";

const registerFieldsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(1, { message: "Senha é obrigatória" })
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres" }),
  display_name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(200, { message: "Nome deve ter no máximo 200 caracteres" }),
});

export const registerUserBodySchema = registerFieldsSchema;

export const registerUserFormSchema = registerFieldsSchema
  .extend({
    password_confirm: z
      .string()
      .min(1, { message: "Confirmação de senha é obrigatória" }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "As senhas não coincidem",
    path: ["password_confirm"],
  });

export type RegisterUserBody = z.infer<typeof registerUserBodySchema>;
export type RegisterUserFormValues = z.infer<typeof registerUserFormSchema>;
