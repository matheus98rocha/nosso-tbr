import { apiJson } from "@/lib/api/clientJsonFetch";

import type { AdminUserListItem, InviteLinkPayload } from "../types/admin.types";

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  return apiJson<AdminUserListItem[]>("/api/admin/users");
}

export async function getAdminInviteLink(): Promise<InviteLinkPayload> {
  return apiJson<InviteLinkPayload>("/api/admin/invite-link");
}

export async function promoteAdminUser(userId: string): Promise<void> {
  await apiJson<{ ok: true; tier: "admin" }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ tier: "admin" }),
    },
  );
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  );
}
