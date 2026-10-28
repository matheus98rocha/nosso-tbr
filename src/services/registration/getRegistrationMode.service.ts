import { apiJson } from "@/lib/api/clientJsonFetch";
import type { RegistrationMode } from "@/lib/auth/registrationMode";

export type RegistrationModePayload = {
  mode: RegistrationMode;
};

export async function getRegistrationMode(): Promise<RegistrationModePayload> {
  return apiJson<RegistrationModePayload>("/api/auth/registration");
}
