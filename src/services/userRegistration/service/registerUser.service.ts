import type { RegisterUserBody } from "../validators/userRegistration.validator";

export async function registerUser(
  payload: RegisterUserBody,
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
