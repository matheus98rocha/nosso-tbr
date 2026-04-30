import { z } from "zod";
import {
  passwordHasLetter,
  passwordHasNumber,
} from "@/utils/passwordRules";

const registerFieldsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(1, { message: "Senha é obrigatória" })
    .min(8, {
      message: "Sua senha precisa ter pelo menos 8 caracteres. Isso ajuda a proteger sua conta.",
    })
    .refine(passwordHasLetter, {
      message: "Adicione pelo menos uma letra para sua senha ficar mais segura.",
    })
    .refine(passwordHasNumber, {
      message: "Inclua pelo menos um número junto com as letras.",
    }),
  display_name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(200, { message: "Nome deve ter no máximo 200 caracteres" }),
  invite: z
    .string()
    .trim()
    .min(1, { message: "Link de cadastro inválido. Use o convite que recebeu." }),
});

export const registerUserBodySchema = registerFieldsSchema;

export const registerUserFormSchema = registerUserBodySchema
  .extend({
    password_confirm: z
      .string()
      .min(1, {
        message: "Digite a mesma senha novamente no campo de confirmação.",
      }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message:
      "As duas senhas precisam ser iguais. Verifique se não há espaços a mais e tente de novo.",
    path: ["password_confirm"],
  });

export type RegisterUserBody = z.infer<typeof registerUserBodySchema>;
export type RegisterUserFormValues = z.infer<typeof registerUserFormSchema>;
