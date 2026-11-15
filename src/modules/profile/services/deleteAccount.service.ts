import { apiJson } from "@/lib/api/clientJsonFetch";

export async function deleteOwnAccount(): Promise<void> {
  await apiJson<{ ok: true }>("/api/account", { method: "DELETE" });
}
