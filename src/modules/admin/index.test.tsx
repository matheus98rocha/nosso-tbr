import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { adminAccountDeletionDescription } from "@/lib/users/accountDeletionCopy";

import AdminScreen from "./index";
import type { AdminUserListItem } from "./types/admin.types";

const reader: AdminUserListItem = {
  id: "reader-2",
  display_name: "Bia",
  email: "bia@tbr.com",
  tier: "common_user",
  books_count: 2,
  last_sign_in_at: null,
};

vi.mock("./hooks/useAdmin", () => ({
  default: () => ({
    isAdmin: true,
    isLoggedIn: true,
    users: [reader],
    isLoadingUsers: false,
    usersError: null,
    invites: [],
    isLoadingInvites: false,
    invitesError: null,
    inviteSectionDescription: "Cada link permite cadastros até expirar.",
    registrationMode: "invite",
    registrationModeDescription: "Só entra quem recebe um convite.",
    isLoadingRegistration: false,
    registrationError: false,
    setRegistrationMode: vi.fn(),
    isUpdatingRegistration: false,
    openRegistrationUrl: "http://localhost/register",
    copiedRegistrationLink: false,
    copyOpenRegistrationLink: vi.fn(),
    createInvite: vi.fn(),
    isCreatingInvite: false,
    copiedInviteId: null,
    copyInviteLink: vi.fn(),
    formatInviteExpiry: () => "amanhã",
    formatLastSignIn: () => "Nunca",
    tierLabel: () => "Common-user",
    userPendingDelete: reader,
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteUser: vi.fn(),
    promoteUser: vi.fn(),
    canDeleteUser: () => true,
    canPromoteUser: () => true,
    deleteConfirmDescription: adminAccountDeletionDescription("Bia"),
    isPromoting: false,
    promotingUserId: null,
  }),
}));

describe("AdminScreen", () => {
  it("avisa que excluir outro usuário não é reversível", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <AdminScreen />
      </QueryClientProvider>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Essa decisão não é reversível.");
    expect(dialog).toHaveTextContent("livros");
    expect(dialog).toHaveTextContent("cronogramas");
    expect(dialog).toHaveTextContent("notas");
  });
});
