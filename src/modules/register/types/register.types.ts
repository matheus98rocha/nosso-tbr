import type { RegistrationMode } from "@/lib/auth/registrationMode";

export type RegisterFormProps = {
  inviteToken: string;
  mode: RegistrationMode;
};

export type RegisterPasswordHintsProps = {
  password: string;
};
