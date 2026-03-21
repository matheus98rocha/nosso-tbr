import { UserDomain } from "../types/users.types";

export async function getUsers(): Promise<UserDomain[]> {
  const res = await fetch("/api/users", {
    next: { tags: ["users"] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
}
