import { apiJson } from "@/lib/api/clientJsonFetch";
import type { RegistrationMode } from "@/lib/auth/registrationMode";

import type {
  AdminInvitesPayload,
  AdminUserListItem,
  CreateAdminInvitePayload,
  RegistrationModePayload,
} from "../types/admin.types";

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  return apiJson<AdminUserListItem[]>("/api/admin/users");
}

export async function getAdminInvites(): Promise<AdminInvitesPayload> {
  return apiJson<AdminInvitesPayload>("/api/admin/invites");
}

export async function createAdminInvite(): Promise<CreateAdminInvitePayload> {
  return apiJson<CreateAdminInvitePayload>("/api/admin/invites", {
    method: "POST",
  });
}

export async function updateRegistrationMode(
  mode: RegistrationMode,
): Promise<RegistrationModePayload> {
  return apiJson<RegistrationModePayload>("/api/admin/registration", {
    method: "PATCH",
    body: JSON.stringify({ mode }),
  });
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
