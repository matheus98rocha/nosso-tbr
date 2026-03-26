import type { RegisterUserApiPayload } from "../types/userRegistration.types";

export async function registerUser(
  payload: RegisterUserApiPayload,
): Promise<{ ok: true }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Registration failed");
  }

  return { ok: true };
}
